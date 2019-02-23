// Initialization

gapi.client.init({
  client_id: '527715214680-6ob4fsq8ir7q6uoe9b2mk8ok7id600p4.apps.googleusercontent.com',
  scope: 'profile'
})

/**
 * Add listeners for authentication actions.
 */
chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
  if (request.text === 'login') {
    return Auth.login()
      .then(user => chrome.runtime.sendMessage({ text: 'loggedin', user: user }))
  }

  if (request.text === 'logout') {
    return Auth.logout()
      .then(() => sendResponse({ text: 'user logged out' }))
  }
})

/**
 * Cognito syntax sugar.
 */
const Auth = {

  /**
   * Log the user in.
   * TODO: Errors.
   *
   * @return {Promise<any>} The user object.
   */
  async login () {
    console.log('login')

    return {
      name: 'asd'
    }
  },

  /**
   * Terminate the session.
   */
  async logout () {
    console.log('logout')
  }

}
