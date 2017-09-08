// Profile UI
// Made by Reday Yahya | @RedayY
// Displays the users profile details


// Listen to signin requests
hello.on('auth.login', function (r) {
	// Get Profile
	hello(r.network).api('/me').then(function (p) {

		btn_format();
		console.log(p);
		pushToDB();
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
	hello('google').api('me').then(function (upp) {
		document.getElementById("google").innerHTML = "<img src='" + upp.thumbnail + "' id='profileIMG'/> <p id='profileName'>" + upp.name;
	})
}

function pushToDB() {

	//Creating the Object for the DB
	hello('google').api('me').then(function (up) {

		var UserProfileObject = {
			"displayName": up.displayName,
			"name": up.name, //p.firs_tname + " " + p.last_name;
			"tagline": up.tagline,
			"aboutMe": up.aboutMe,
			"emailAddress": up.email,
			"gender": up.gender,
			"birthday": up.birthday, //added birthday
			"occupation": up.occupation,
			"pictureUrl": up.picture,
			"createdOn": up.birthday,
			"activeSession": [sessionSchema]
		};
		console.log(UserProfileObject);
	})

	// Bit to add to send this object off to server goes into here
	// Logic : Look for User (EMAIL), if user does not exsist add it to the DB
	// Once it stores, SenseMap on update will add Nodes to Nodelist in DB
	// something something post something something submit form

}