//external JS to give buttons functionality

//Jquery for Button action
$(function(){
  $('#btn_run').click(function(){get_Info();});
  $('#btn_logout').click(function(){google_logout();});
});

//login
function get_Info() {
  hello( 'google' ).login( function() {
  token = hello( 'google' ).getAuthResponse().access_token;
});
}

//logout
function google_logout() {
	hello('google').logout().then(function() {
	alert('Signed out');
}, function(e) {
	alert('Signed out error: ' + e.error.message);
});
}

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
