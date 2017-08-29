//Made by Reday Yahya | @RedayY
//JavaScript Document for SenseMap Control Panel

//Jquery for Button action
$(function(){
  $('#btn_login').click(function(){google_Login();});
  $('#btn_logout').click(function(){google_Logout();});
  $('#btn_openSense').click(function(){openSensemap();});
});


function google_Login(){

    //HelloJS network identifier
    var google = hello('google');

	  //Forcing E-Mail out of profile Object
    google.login({
      scope: 'email',
      force: true}).then(function(){
    return google.api('me');
    })
};

function google_Logout(){
hello('google').logout().then(function() {
  alert('Signed out');
  document.getElementById("btn_logout").disabled = true;
  document.getElementById("btn_login").style.color = "red";
  location.reload();
}, function(e) {
  alert('Signed out error: ' + e.error.message);
  });
};

function openSensemap(){
  chrome.windows.create({'url': 'src/html/historyMapPage.html', 'type': 'popup'}, function(window) {
   });
};

window.onload = function button_config(){
  document.getElementById("btn_logout").disabled = true;
  document.getElementById("btn_logout").style.color = "red";
}