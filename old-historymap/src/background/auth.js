
/**
 * Basic auth configuration.
 */
const googleClientId = '959526320490-n8sju47gtn52m7tidvbs285qb9vv3cmu.apps.googleusercontent.com'
const googleLoginType = 'accounts.google.com'
const identityPoolId = 'eu-west-2:515f3296-8235-40d1-99a6-49716ed1328a'
const identityPoolRegion = 'eu-west-2'
const apiGatewayUrl = 'https://bw4dok4cae.execute-api.eu-west-2.amazonaws.com/prod'
const apiGatewayRegion = 'eu-west-2'

/**
 * Add listeners for authentication actions.
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'auth') {
    return
  }

  port.onMessage.addListener(async (request) => {
    if (request.action === 'login') {
      return Auth.login()
        .then(session => port.postMessage({ ok: true, session }))
        .catch(error => port.postMessage({ ok: false, error }))
    }

    if (request.action === 'logout') {
      return Auth.logout()
        .then(() => port.postMessage({ ok: true }))
        .catch(error => port.postMessage({ ok: false, error }))
    }

    if (request.action === 'session') {
      return Auth.session()
        .then(session => port.postMessage({ ok: true, session }))
        .catch(error => port.postMessage({ ok: false, error }))
    }
  })
})

/**
 * Cognito syntax sugar.
 */
const Auth = {

  /**
   * Log the user in.
   *
   * @return {Promise<any>} The user object.
   */
  async login () {
    // Authenticate the user and save the session data to the sync storage.
    await this._authenticate()

    // Create cognito identity credentials.
    await this.credentials()

    // Fire an event and return the session data.
    const session = await this.session()

    this.onLogin.dispatch(session)

    return session
  },

  /**
   * Terminate the session.
   */
  async logout () {
    // Destroy the session stored in the storage.
    return this._destroySession()
  },


  /**
   * Retrieve the session data from the sync storage.
   *
   * @return {Promise<any>} The session data
   */
  async session () {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('auth.session', item => item['auth.session']
        ? resolve(item['auth.session'])
        : reject('No user in session')
      )
    })
      .then((session) => new Promise((resolve, reject) => {
        AWS.config.region = identityPoolRegion
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: identityPoolId,
          Logins: { [googleLoginType]: session.idToken },
        })

        AWS.config.credentials.get(e => e ? reject(e) : resolve(session))
      }))
  },

  /**
   * Get the coginto idendity session.
   *
   * @return {Promise<any>} The credentials object
   */
  async credentials () {
    return this.session()
      .then((session) => new Promise((resolve) => {
        AWS.config.region = identityPoolRegion
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: identityPoolId,
          Logins: { [googleLoginType]: session.idToken },
        })

        AWS.config.credentials.get(() => resolve(AWS.config.credentials))
      }))
  },

  /**
   * Make an authenticated request to the API Gateway.
   *
   * @param {string} method The request method
   * @param {string} path The path
   * @param {any} body The request body
   * @param {object} queryParams Query parameters
   * @param {object} headers The request headers
   * @return {Promise<any>} The response
   */
  async request (method, path, body, queryParams = {}, headers = {}) {
    const credentials = await this.credentials()

    // Sign the request.
    const request = sigV4Client
      .newClient({
        accessKey: credentials.accessKeyId,
        secretKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
        region: apiGatewayRegion,
        endpoint: apiGatewayUrl
      })
      .signRequest({
        method: method.toUpperCase(),
        path,
        queryParams,
        body,
        headers
      })

    // Send the signed request.
    return axios.request({
      url: request.url,
      method,
      headers: request.headers,
      data: body
    }).then(({ data }) => data)
  },

  /**
   * Initialize the user session via google apis.
   */
  async _authenticate () {
    return new Promise((resolve, reject) => {
      const url = new URL('https://accounts.google.com/o/oauth2/auth')

      url.searchParams.set('client_id', googleClientId)
      url.searchParams.set('redirect_uri', chrome.identity.getRedirectURL('oauth2'))
      url.searchParams.set('response_type', 'id_token token')
      url.searchParams.set('access_type', 'online')
      url.searchParams.set('scope', 'openid profile email')

      // Launch the google oauth flow.
      chrome.identity.launchWebAuthFlow({
        url: url.toString(),
        interactive: true
      }, async (response) => {
        if (chrome.runtime.lastError) {
          reject('Failed to launch the authentication flow')
        }

        // Should reject the promise automatically if anything goes wrong.
        const idToken = new URL(response).hash.match(/id_token=([^&]+)/)[1]
        const accessToken = new URL(response).hash.match(/access_token=([^&]+)/)[1]
        const profile = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(({ data }) => data)

        // Save the session data to the storage.
        return this._saveSession({
          idToken,
          accessToken,
          profile,
        }).then(resolve)
      })
    })
  },

  /**
   * Save the sesion data to the sync storage.
   *
   * @param {any} session The session data.
   */
  async _saveSession (session) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ 'auth.session': session }, () => resolve())
    })
  },

  /**
   * Destroy the session.
   */
  async _destroySession () {
    return new Promise((resolve) => {
      chrome.storage.sync.remove('auth.session', () => resolve())
    })
  },

  /**
   * Events are defined here.
   */
  onLogin: new Event(),

}
