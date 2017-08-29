//Open Login onload
window.onload = function get_Info() {
	
            //HelloJS network identifier
            var google = hello('google');
	
            //Forcing E-Mail out of profile Object
            google.login({
            scope: 'email',
            force: true}).then(function(){
            return google.api('me');
            })
};

//Logout on unload
window.onbeforeunload = function google_logout(){
	hello('google').logout().then(function() {
	alert('Signed out');
}, function(e) {
  alert('Signed out error: ' + e.error.message);
  });
}


