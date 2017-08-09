//external JS to give buttons functionality

        //login Button

var x = document.getElementById("myBtn");
if(x){
x.addEventListener("click", myFunction);
x.addEventListener("click", someOtherFunction);

function myFunction() {
   document.getElementById("target_aq").style.color('red');
    console.log("IS THIS DOING ANYTHING AT ALL ?");
}

function someOtherFunction() {
    alert ("This function was also executed!")
    console.log("IS THIS DOING ANYTHING AT ALL ?");
}

};

  /*      //experiment
    document.addEventListener('DOMContentLoaded', function() {
        var link = document.getElementById('logGoogleBTN');
        link.addEventListener('click', function() {
            hello('google').login();
            console.log("IS THIS DOING ANYTHING AT ALL ?");
    });
});

        //logout Button
        var LogoutBTN = document.getElementById('LogOutBTN');
            LogoutBTN.onclick = function()
                {
                    hello('google').logout();
                    console.log("IS THIS DOING ANYTHING AT ALL ?");
                };
*/




        //Hello.js Initilization
        hello.init({
	        google: '216563153005-vsqoeo6ot311amn4k6dtokn96aj72cth.apps.googleusercontent.com'
        }, {redirect_uri: 'redirect.html'});

        hello.on('auth.login', function(auth) {

	        // Call user information, for the given network
	        hello(auth.network).api('me').then(function(r) {

		    // Inject it into the container
		        var label = document.getElementById('profile_' + auth.network);
		            if (!label) {
			            label = document.createElement('div');
			            label.id = 'profile_' + auth.network;
			            document.getElementById('profile').appendChild(label);
                    }
                                
		label.innerHTML = '<img src="' + r.thumbnail + '" /> Hey ' + r.name;
	});
});