// DB Login/Registration Document
// Made by Reday Yahya | @RedayY
// Login/Registration Logic including User Profile display

//Profile specific Variables
let AccLoggedIn;
let UserRecord = true;
let UserEmail;
let UserProfile;


// Listens to Login requests and executes functions upon verification
hello.on('auth.login', function (r) {

	// Get Profile
	hello(r.network).api('/me').then(function (p) {

		btn_format();
		draw_profile();
		askForSession();
		AccLoggedIn = true;
		UserEmail = p.email;


		// On chrome apps we're not able to get remote images
		// This is a workaround
		if (typeof (chrome) === 'object') {
			img_xhr(label.getElementsByTagName('img')[0], p.thumbnail);
		}
	});
});

function btn_format() {
	document.getElementById("btn_login").disabled = true;
	document.getElementById("btn_logout").disabled = false;
	document.getElementById("btn_logout").style.color = "darkmagenta";
	document.getElementById("btn_login").style.color = "red";
};

function draw_profile() {
	hello('google').api('me').then(function (upp) {
		document.getElementById("networkName").innerHTML = "<p>" + upp.name;
		document.getElementById("Image").innerHTML = "<img src='" + upp.thumbnail + "'id='profileIMG'/>";
		document.getElementById("SessName").innerHTML = "<p> Session Name: " + SessionName + " </p>";
	})
}

//var little_helper = 'https://' + chrome.runtime.id + '.chromiumapp.org/tests/Reday/tests.jasmine.html';
