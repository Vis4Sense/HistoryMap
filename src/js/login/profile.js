// Profile UI
// Made by Reday Yahya | @RedayY
// Displays the users profile details


// Listen to signin requests
hello.on('auth.login', function (r) {
	// Get Profile
	hello(r.network).api('/me').then(function (p) {

		console.log(p);
		btn_format();
		draw_profile();


		// On chrome apps we're not able to get remote images
		// This is a workaround
		if (typeof (chrome) === 'object') {
			img_xhr(label.getElementsByTagName('img')[0], p.thumbnail);
		}
	});
});

function btn_format() {
	document.getElementById("btn_login").style.visibility = 'hidden';
	document.getElementById("btn_logout").disabled = false;
	document.getElementById("btn_logout").style.color = "darkmagenta";
	document.getElementById("btn_logout").style.visibility = 'visible';
	document.getElementById("btn_login").style.color = "red";
};

function draw_profile() {
	var label = document.getElementById(r.network);
	label.innerHTML = "<img src='" + p.thumbnail + "' id='profileIMG'/> <p id='profileName'>" + p.name;
	document.getElementById("savSess").innerHTML = "Saved Session";
}