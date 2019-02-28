
const Messaging = {

  /**
   * Send a message via a port.
   *
   * @param {string} name The port name
   * @param {any} request The request
   * @return {Promise<any>} The response
   */
  async send (name, request = {}) {
    return new Promise((resolve, reject) => {
      const port = chrome.runtime.connect({ name })

      port.onMessage.addListener((response) => {
        response.ok ? resolve(response) : reject(response)
      })

      port.postMessage(request)
    })
  }

}
