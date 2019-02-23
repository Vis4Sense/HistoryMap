
/**
 * Basic auth configuration.
 */
const googleClientId = '527715214680-3eqom1v7vv9s7oeh9frb7ee2ommr2t88.apps.googleusercontent.com'
const googleLoginType = 'accounts.google.com'
const identityPoolId = 'eu-west-1:cf66235e-c684-4f02-bb4c-e7feadbe2f65'
const identityPoolRegion = 'eu-west-1'

/**
 * Add listeners for authentication actions.
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'auth') {
    return
  }

  // TODO: Errors.
  port.onMessage.addListener((request) => {
    if (request.action === 'login') {
      return Auth.login()
        .then(session => port.postMessage({ ok: true, session }))
        .catch(() => port.postMessage({ ok: false }))
    }

    if (request.action === 'logout') {
      return Auth.logout()
        .then(() => port.postMessage({ ok: true }))
        .catch(() => port.postMessage({ ok: false }))
    }

    if (request.action === 'session') {
      return Auth.session()
        .then(session => port.postMessage({ ok: true, session }))
        .catch(() => port.postMessage({ ok: false }))
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

    console.log(await this.session())

    // Return the session data.
    return this.session()
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
      chrome.storage.sync.get('session', ({ session }) => session ? resolve(session) : reject())
    })
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
          reject()
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
      chrome.storage.sync.set({ session }, () => resolve())
    })
  },

  /**
   * Destroy the session.
   */
  async _destroySession () {
    return new Promise((resolve) => {
      chrome.storage.sync.remove('session', () => resolve())
    })
  }

}
