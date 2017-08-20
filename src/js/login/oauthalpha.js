//external JS to give buttons functionality

//Jquery for Button action
$(function(){
  $('#btn_run').click(function(){get_Info();});
  $('#btn_logout').click(function(){google_logout();});
});

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
}

//logout
function google_logout() {
	hello('google').logout().then(function() {
	alert('Signed out');
}, function(e) {
	alert('Signed out error: ' + e.error.message);
});
}


