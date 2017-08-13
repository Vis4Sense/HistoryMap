// Profile UI
// Displays the users profile details


// Listen to signin requests
hello.on('auth.login', function(r) {
	// Get Profile
	hello( r.network ).api( '/me' ).then( function(p) {
        var label = document.getElementById(r.network);
        label.innerHTML = "<img src='"+ p.thumbnail + "' width=50/>Connected to "+ r.network+" as " + p.name;

        //creating Profile Object for MongoDB useage
        hello('google').api('me').then(function(json) {

            var SenseMapUser = {
                FirstName : json.first_name,
                LastName : json.last_name,
                email : json.email,
                picture : json.picture,
                gender : json.gender,
                language : json.language,
            }

        //minor debug
        console.log(SenseMapUser);
});

            /*fetching HTML 
            var Profile_FirstName = document.getElementById(FirstName);
            var Profile_LastName = document.getElementById(LastName);
            var Profile_email = document.getElementById(E-Mail);
            var Profile_gender = document.getElementById(Gender);
            var Profile_image = document.getElementById(profileimage);
            var Profile_language = document.getElementById(language);
            */


		// On chrome apps we're not able to get remote images
		// This is a workaround
		if (typeof(chrome) === 'object') {
			img_xhr(label.getElementsByTagName('img')[0], p.thumbnail);
		}
	});
});

// Bind events to the buttons on the page
var b = Array.prototype.slice.call(document.querySelectorAll('button.profile'));
b.forEach(function(btn){
	btn.onclick = function(){
        hello(this.id).login();
	};
});

// Utility for loading the thumbnail in chromeapp
function img_xhr(img, url) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'blob';
	xhr.onload = function(e) {
		img.src = window.URL.createObjectURL(this.response);
	};
	xhr.send();
}

