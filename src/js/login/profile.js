// DB Login/Registration Document
// Made by Reday Yahya | @RedayY
// Login/Registration Logic including User Profile display


// Listen to signin requests
hello.on('auth.login', function (r) {
	// Get Profile
	hello(r.network).api('/me').then(function (p) {

		//debug function
		//die_for_me();

		btn_format();
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
			"name": up.name,
			"emailAddress": up.email,
			"addtionalinfo": Object.values(up),
			//"activeSession": [sessionSchema]
		};

		//Crucial Bit that Adds the User to the DB, if the user has something on the DB, do not add at all cost.
		//Code is based on Shaz example

		//check if email is in db
		var url = "https://sensemap-api.herokuapp.com/userbyemail/" + up.email + "/3yARG4zzLndmE39Mw00xigqDV3lOrjEJ/";
		var xhr = new XMLHttpRequest()
		xhr.open('GET', url, true)
		xhr.onload = function () {
			var users = JSON.parse(xhr.responseText);
			if (xhr.readyState == 4 && xhr.status == "200") {
				console.table(users);
				console.log(users);
				if (users.length == 0) {
					add_user_to_db();
				}
			} else {
				console.log("Could not perform action")
			}
		}
		xhr.send(null);
	})
}

// Minor Debug function
function die_for_me() {

	var url = "https://sensemap-api.herokuapp.com/user/5995669767008e00111c033f/3yARG4zzLndmE39Mw00xigqDV3lOrjEJ/";
	var xhr = new XMLHttpRequest();
	xhr.open("DELETE", url, true);
	xhr.onload = function () {
		var users = JSON.parse(xhr.responseText);
		if (xhr.readyState == 4 && xhr.status == "200") {
			console.table(users);
			console.log("murder");
		} else {
			console.error(users);
			console.log("dead end couldn't do it");
		}
	}
	xhr.send(null);
}

//due to bugs its better to do this in a seperate function

function add_user_to_db() {
	//Creating the Object for the DB
	hello('google').api('me').then(function (up) {

		var new_stuff = {
			"name": up.name,
			"emailAddress": up.email,
			"addtionalinfo": Object.values(up),
			//"activeSession": [sessionSchema]
		};

		// Adding the User to the DB
		var url = "https://sensemap-api.herokuapp.com/users/3yARG4zzLndmE39Mw00xigqDV3lOrjEJ/";
		var json = JSON.stringify(new_stuff);
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
		xhr.onload = function () {
			var users = JSON.parse(xhr.responseText);
		}
		xhr.send(json);
	})
}