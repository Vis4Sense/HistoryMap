//Made by Reday Yahya | @RedayY
//JavaScript Document for SenseMap Control Panel

//Jquery for Button action
$(function () {
	$('#btn_login').click(function () { googleLogin(); });
	$('#btn_logout').click(function () { googleLogout(); });
	$('#btn_openSense').click(function () { openSensemap(); });
});

function googleLogin() {

	//HelloJS network identifier
	var google = hello('google');

	//Forcing E-Mail out of profile Object
	google.login({
		scope: 'email',
		force: true
	}).then(function () {
		return google.api('me');
	})
};

function googleLogout() {
	hello('google').logout().then(function () {
		alert('Signed out');
		document.getElementById("btn_logout").disabled = true;
		document.getElementById("btn_login").style.color = "red";
		document.getElementById("btn_login").style.visibility = 'visible';
		location.reload();
	}, function (e) {
		alert('Signed out error: ' + e.error.message);
	});
};

function openSensemap() {
	chrome.windows.create({ 'url': 'src/html/historyMapPage.html', 'type': 'popup' }, function (window) {
	});
};

window.onload = function button_config() {
	document.getElementById("btn_logout").disabled = true;
	document.getElementById("btn_logout").style.color = "red";
	document.getElementById("btn_logout").style.visibility = 'hidden';

	//checks wether HistoryMap is opens, if not open it on launch, if yes then do not open.
	chrome.tabs.query({ 'url': 'chrome-extension://lajblbdkejaddpihfeeihnicfkmiojem/src/html/historyMapPage.html' }, function (results) {
		if (results.length == 0) {
			openSensemap();
		}
	});
};
