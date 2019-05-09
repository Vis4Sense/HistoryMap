
class Event {

  constructor () {
    this.listeners = []
  }

  /**
   * Add a new listener to the event.
   *
   * @param {Function} listener The listener to be added
   */
  addListener (listener) {
    this.listeners.push(listener)
  }

  /**
   * Dispatch the given event.
   *
   * @param {any[]} payload The payload to send
   */
  dispatch (...payload) {
    this.listeners.forEach(listener => listener(...payload))
  }

}
