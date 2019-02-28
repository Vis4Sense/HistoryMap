let SessionName
let SessionProfile
let recording = true // whether new noded is added to historymap or not
let loggedIn = false // whether user is logged in
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
    historyMap.database.sessions.displaySessions()
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

// chrome.runtime.onMessage.addListener(function (request) {
//     if (request.text === 'loggedin') {
//         loggedIn = true;
//         historyMap.model.user = request.user;
//     }
// });

/**
 * Redraw the menu based on the current application context.
 */
const redrawMenu = () => {

  if (recording) {
    document.getElementById("btn_start").style.display = "none"
    document.getElementById("btn_pause").style.display = "initial"
  } else {
    document.getElementById("btn_start").style.display = "initial"
    document.getElementById("btn_pause").style.display = "none"
  }

  if (session !== null) {
    document.getElementById("btn_login").style.display = "none"
    document.getElementById("btn_logout").style.display = "initial"
    document.getElementById('userImage').style.display = "initial"
    document.getElementById('userImage').src = session.profile.picture

    //checks if User has Sessions Saved, displays load if true

    // if (session !== null) {
    //   if (SessionProfile.length == 0) {
    //       document.getElementById("btn_load").style.display = 'none'
    //   } else {
    //       document.getElementById("btn_load").style.display = 'initial'
    //   }
    // } else {
    //     document.getElementById("btn_load").style.display = 'none'
    // }

  } else {
      document.getElementById("btn_login").style.display = "initial"
      document.getElementById("btn_logout").style.display = "none"
      document.getElementById("btn_load").style.display = "none"
      document.getElementById('userImage').style.display = "none"
  }
}

function newHistoryMap() {

    let confirmed = false;

    console.log(CircularJSON.stringify(historyMap.model.tree))

    // MARK: Where data is
    if (!loggedIn && historyMap.model.nodes.getSize() > 0) {
        confirmed = confirm("Do you want to start a new session? All the progress will be lost if you are not logged in.")
    }

    if (loggedIn || confirmed) {

        historyMap.model.nodes.empty();

        if (loggedIn) {
            // so user can't create press the 'new' button more than once.
            document.getElementById('btn_new').disabled = true;

            // add a text field
            var input = document.createElement('input');
            input.type = 'text';
            var today = new Date();
            //input.placeholder = today;
            input.value = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
            input.id = 'sessionName';
            document.getElementById('settings').appendChild(input);
            input.focus();

            // add a button
            var button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = 'Create';
            button.id = 'btn_new_sess';
            document.getElementById('settings').appendChild(button);

            $(function () {
                $('#btn_new_sess').click(function () {
                    historyMap.database.sessions.newSession();
                })
            });
        }
    }
}

//This loads the Sessions in a menu
historyMap.database.sessions.displaySessions = function () {

    document.getElementById("btn_load").setAttribute("disabled", "disabled");

    // Managing generated HTML Elements
    var Div = document.getElementById("Select-Option");
    var selectList = document.createElement("select");
    selectList.id = "mySelect";
    Div.appendChild(selectList);

    // Looping thorugh SessionProfile and generating selects
    for (var i = 0; i < SessionProfile.length; i++) {

        // Generating Option for Select List in combination of Data
        var option = document.createElement("option");
        option.value = SessionProfile[i]._id;
        option.text = SessionProfile[i].name;
        selectList.appendChild(option);
    };

    document.getElementById("mySelect").selectedIndex = -1;

    // Adding listener to trigger when Select makes a change also reset interface for next load
    document.getElementById("mySelect").addEventListener("change", function (e) {
        historyMap.database.user.setSelectedSession();
        document.getElementById("btn_load").setAttribute("enabled", "enabled");
    });

    // Create event and fire it.
    var changeEvent = document.createEvent("HTMLEvents");
    changeEvent.initEvent("change", true, true);
};

historyMap.database.sessions.newSession = function () {
    SessionName = document.getElementById('sessionName').value;
    document.getElementById("sessionName").remove();
    document.getElementById("btn_new_sess").remove();
    document.getElementById('btn_new').disabled = false;

    //Hacky way to prevent users from creating duplicate Sessions.
    //Looping thorugh SessionProfile
    if (typeof SessionProfile == 'undefined' || SessionProfile == null) {
        console.log("Saving Session: " + SessionName);
        historyMap.database.user.pushSessToDB();
    } else {
        var noDuplicate = true;

        for (var i = 0; i < SessionProfile.length; i++) {

            //If SessionName matches a Session Generated alert the user
            if (SessionName == SessionProfile[i].name) {
                noDuplicate = false;
                window.alert("Session Name already exsits, please choose a different Session Name");
                break;
            }
        };
        if (noDuplicate) {
            //Pushes Session to DB
            console.log("Saving Session: " + SessionName);
            historyMap.database.user.pushSessToDB();
        }
    }

}

//This connects to the API and loads user sessions and stores it in HistoryMapModel
historyMap.database.sessions.loadUserSessions = function () {
    var url = baseURL + "session/" + db.user.profile.email + "/" + historyMap.database.user.APIKey;
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "200") {
            //picking out Session Information from User Account
            SessionProfile = users["sessions"];
            historyMap.model.sessions = SessionProfile;
            db.user.SessionProfile = users["sessions"];
            redrawMenu();
        } else {}
    }
    xhr.send(null);
}
