// Made by Reday Yahya | @RedayY
// JavaScript Document for Login Functionality (Previously this was the control panel)

// Jquery for Button action

var SessionName;
var SessionCount;


$(function () {
  $('#btn_login').click(function () {
    google_Login();
  });
  $('#btn_logout').click(function () {
    google_Logout();
  });
  $('#btn_start').click(function () {
    start_recording();
    btn_pause_start_conf();
  });
  $('#btn_pause').click(function () {
    pause_recording();
    btn_pause_start_conf();
  });
  $('#btn_new').click(function () {
    reset_sense();
  });
  $('#btn_load').click(function () {
    load_session();
  });
  $('#btn_mySessions').click(function () {
    load_MySession();
  });
});

function google_Login() {

  // HelloJS network identifier
  var google = hello('google');

  // Forcing E-Mail out of profile Object
  google.login({
    scope: 'email',
    force: true
  }).then(function () {
    return google.api('me');
  })
};

function google_Logout() {

  var answer = confirm("Logging Out will reload SenseMap, do you wish to Continue?")
  if (answer) {
    hello('google').logout().then(function () {
      alert('Signed out');
      btn_reset();
      LoggedIn = false;
      location.reload();
    }, function (e) {
      alert('Signed out error: ' + e.error.message);
    });
  };
}


// function openSensemap() {
//   chrome.windows.create({
//     'url': 'src/html/historyMapPage.html',
//     'type': 'popup'
//   }, function (window) {});
// };

window.onload = function button_config() {
  document.getElementById("btn_logout").disabled = true;
  document.getElementById("btn_logout").style.color = "red";
  document.getElementById("btn_login").style.color = "darkmagenta";
  btn_pause_start_conf();
};

function btn_reset() {
  document.getElementById("btn_logout").disabled = true;
  document.getElementById("btn_login").style.color = "darkmagenta";
}

function btn_pause_start_conf() {

  if (UserRecord == true) {
    document.getElementById("btn_start").disabled = true;
    document.getElementById("btn_pause").disabled = false;
    document.getElementById("btn_pause").style.color = "darkmagenta";
    document.getElementById("btn_start").style.color = "red";
  } else {
    document.getElementById("btn_pause").disabled = true;
    document.getElementById("btn_start").disabled = false;
    document.getElementById("btn_pause").style.color = "red";
    document.getElementById("btn_start").style.color = "darkmagenta";
  }

}

function askForSession() {
  var UserInput = prompt("Please enter a Session Name");
  if (UserInput == null || UserInput == "" || UserInput == " ") {
    window.alert("Please enter a suitable Session Name");
    askForSession();
  } else {
    SessionName = UserInput;
    window.alert("Using Session Name: " + UserInput);
  }
}

function reset_sense() {
  var answer = confirm("Would you like to start over again, this do not log you out, does you still wish to Continue?")
  if (answer) {
    location.reload();
  } else {
    window.alert("SenseMap did not restart, carry on!")
  }
}

function load_session() {
  var sesReq = prompt("Please enter a Session Name");
  if (sesReq == null || sesReq == "" || sesReq == " ") {
    window.alert("Please enter a suitable Session ID");
    load_Session();
  } else {
    searchSessionName = sesReq;

    //code to load session goes here
    
    window.alert("Loaded Session Name: " + searchSessionName);
  }
}

function load_MySession() {
  var $container = $("#pictureBlock ul");

  var url = "http://sensemap-api.herokuapp.com/session/" + UserEmail + "/3yARG4zzLndmE39Mw00xigqDV3lOrjEJ/";
  var xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.onload = function () {
    var users = JSON.parse(xhr.responseText);
    if (xhr.readyState == 4 && xhr.status == "200") {
      //display session information (need to make this clickable)
      for (var i = 1; i => SessionCount; i++) {
        $container.append('<li><p>'+ UserProfile[i].sessionname + '</p> <p>'+ UserProfile[i]._id + '</p></li>');
      }

      //now just get the user to select the session and load using load_selectedSession(i)

    } else {

      window.alert("You do not have any saved sessions under this Account");

    }
  }
  xhr.send(null);
}

function load_SelectedSession(i){
  nodes.length = 0;
  nodes = UserProfile[i].nodes;
}