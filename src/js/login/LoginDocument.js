// Made by Reday Yahya | @RedayY
// JavaScript Document for Login Functionality (Previously this was the control panel)

// Jquery for Button action
$(function () {
  $('#btn_login').click(function () {
    google_Login();
  });
  $('#btn_logout').click(function () {
    google_Logout();
  });
  $('#btn_openSense').click(function () {
    openSensemap();
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
  document.getElementById("btn_logout").style.visibility = 'hidden';
  document.getElementById("btn_login").style.color = "darkmagenta";
};

function btn_reset() {
  document.getElementById("btn_logout").disabled = true;
  document.getElementById("btn_login").style.color = "darkmagenta";
  document.getElementById("btn_login").style.visibility = 'visible';
  document.getElementById("btn_logout").style.visibility = 'hidden';
}