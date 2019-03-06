
/**
 * Basic configuration.
 */

const minBatchSize = 5

/**
 * Add listeners for persistence actions.
 *
 * TODO: session handling.
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'persistor') {
    return
  }

  // TODO: Errors.
  port.onMessage.addListener(async (request) => {
    if (request.action === 'queue') {
      return Persistor.queue(request.node)
        .then(() => port.postMessage({ ok: true }))
        .catch(() => port.postMessage({ ok: false }))
    }

    if (request.action === 'set-session') {
      return Persistor.setSession(request.session)
        .then(() => port.postMessage({ ok: true }))
        .catch(() => port.postMessage({ ok: false }))
    }

    if (request.action === 'list-sessions') {
      return Persistor.listSessions()
        .then(sessions => port.postMessage({ ok: true, sessions }))
        .catch(() => port.postMessage({ ok: false }))
    }

    if (request.action === 'load-session') {
      return Persistor.loadSession(request.sessionId)
        .then(session => port.postMessage({ ok: true, session }))
        .catch(() => port.postMessage({ ok: false }))
    }

    if (request.action === 'force-commit') {
      return Persistor.commit(force = true)
        .then(() => port.postMessage({ ok: true }))
        .catch(() => port.postMessage({ ok: false }))
    }
  })
})

/**
 * We need to force commit the queue before unloading the window.
 */
window.addEventListener('beforeunload', () => {
  Persistor.commit(force = true)
})

/**
 * We also want to commit the queue when a user just logged in. We also want to
 * surpress any errors because we are not forcing the commit.
 */
Auth.onLogin.addListener(() => {
  Persistor.commit()
    .catch(() => undefined)
})

const Persistor = {

  /**
   * The queue contents.
   */
  _items: {},

  /**
   * Put a new node to the persistor queue.
   *
   * @param {Node} node The node to be queued
   */
  async queue (node) {
    // Push to the queue or update a queued request if there is one already
    // present
    this._items[node.id] === undefined
      ? this._items[node.id] = node
      : this._items[node.id] = { ...this._items[node.id], ...node }

    // Asynchronously attempt to commit the queue.
    this.commit().catch(() => undefined)
  },

  /**
   * Attempt to commit the queue.
   *
   * @param {boolean} force Whether to ignore the minimuim batch size.
   */
  async commit (force = false) {
    // If we are not forcing the commit and the number of items is less than
    // the desired batch size, cancel execution.
    if (!force && Object.keys(this._items).length < minBatchSize) {
      throw new Error('Minimum batch size not reached.')
    }

    return Auth.request('put', '/v1/nodes', {
      nodes: Object.values(this._items),
      sessionId: (await this._getCurrentSession()).id,
      sessionName: (await this._getCurrentSession()).name
    }).then(() => this._items = {})
  },

  /**
   * Set the session.
   *
   * @param {any} session The session
   */
  async setSession (session) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ 'persistor.session': session }, () => resolve())
    })
  },

  /**
   * Load a session.
   *
   * @param {string} sessionId The session id
   * @return {Promise<any>} The session data
   */
  async loadSession (sessionId) {
    const data = await Auth.request('get', '/v1/nodes', undefined, { sessionId })

    // Clear the current queue.
    this._items = {}

    // Reassign the session ID.
    await this.setSession({ id: data[0].sessionId, name: data[0].sessionName })

    return data
  },

  /**
   * List all sessions on the database.
   *
   * @return {Promise<string[]>} The list of session IDs
   */
  async listSessions () {
    return Auth.request('get', '/v1/sessions')
  },

  /**
   * Retrieve the current session.
   *
   * @return {Promise<any>} The session
   */
  async _getCurrentSession () {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('persistor.session', item => item['persistor.session']
        ? resolve(item['persistor.session'])
        : reject('No persistor session found.')
      )
    })
  }

}
