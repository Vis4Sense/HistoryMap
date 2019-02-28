// Redundant 3
let SessionName
let SessionProfile
let loggedIn = false // whether user is logged in

let recording = true // whether new noded is added to historymap or not
let session = null

$(function () {
  $('#btn_start').click(function () {
    recording = true
    redrawMenu()
  })

  $('#btn_pause').click(function () {
    recording = false
    redrawMenu()
  })

  $('#btn_new').click(function () {
    newHistoryMap()
  })

  $('#btn_load').click(function () {
    listSessions()
  })

  $('#btn_logout').click(function () {
    Messaging.send('auth', { action: 'logout' })
      .then(() => {
        session = null
        redrawMenu()
      })
  })

  $('#btn_login').click(function () {
    Messaging.send('auth', { action: 'login' })
      .then((response) => {
        session = response.session
        redrawMenu()
      })
      .catch(() => alert('Authentication failed.'))
  })
})

window.addEventListener('load', () => {

  /**
   * Load the user session from the background script.
   */
  Messaging.send('auth', { action: 'session' })
    .then((response) => {
      session = response.session
      redrawMenu()
    })
    .catch(() => {
      redrawMenu()
    })

  /**
   * Create a new persistence session.
   */
  Messaging.send('persistor', { action: 'set-session', sessionId: uuidv4() })
    .catch(() => undefined)

})

/**
 * Redraw the menu based on the current application context.
 */
const redrawMenu = () => {

  if (recording) {
    document.getElementById('btn_start').style.display = 'none'
    document.getElementById('btn_pause').style.display = 'initial'
  } else {
    document.getElementById('btn_start').style.display = 'initial'
    document.getElementById('btn_pause').style.display = 'none'
  }

  if (session !== null) {
    document.getElementById('btn_login').style.display = 'none'
    document.getElementById('btn_logout').style.display = 'initial'
    document.getElementById('userImage').style.display = 'initial'
    document.getElementById('userImage').src = session.profile.picture
  } else {
      document.getElementById('btn_login').style.display = 'initial'
      document.getElementById('btn_logout').style.display = 'none'
      document.getElementById('btn_load').style.display = 'none'
      document.getElementById('userImage').style.display = 'none'
  }
}

const newHistoryMap = async () => {
  // Check if the user is logged in or they agree to losing all data.
  if (session === null && !confirm('All data will be lost.')) {
    return
  }

  // Set a new session id.
  await Messaging.send('persistor', { action: 'set-session', sessionId: uuidv4() })
    .catch(() => undefined).

  // Clear the history map.
  historyMap.model.nodes.empty()
}

//This loads the Sessions in a menu
const listSessions = async () => {

  document.getElementById('btn_load').setAttribute('disabled', '')

  // Load session from the backend.
  const sessions = await Messaging.send('persistor', { action: 'list-sessions' })
    .then(({ sessions }) => sessions)
    .catch(() => alert('Listing user sessions failed.'))

  // Create a select field.
  const selectContainer = document.getElementById("Select-Option");
  const select = document.createElement("select");
  selectContainer.appendChild(select);

  // Loop through the sessions and show them as options.
  sessions.forEach((session) => {
    const option = document.createElement('option')
    option.setAttribute('value', session)
    option.innerText = session
    select.appendChild(option)
  })

  select.selectedIndex = -1

  select.addEventListener('change', async (e) => {
    const nodes = await Messaging.send('persistor', { action: 'load-session', sessionId: select.value })
      .then(({ session }) => session)
      .catch(() => alert('Loading session failed.'))

    // Load data to the history map.
    historyMap.model.nodes.empty()
    nodes.forEach(n => historyMap.model.nodes.addNode(n))
    historyMap.view.redraw()

    // Clean up.
    select.remove()
    document.getElementById('btn_load').removeAttribute('disabled')
  })
}
