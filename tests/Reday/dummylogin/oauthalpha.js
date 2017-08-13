//external JS to give buttons functionality

//Jquery for Button action
$(function(){
  $('#btn_run').click(function(){get_Info();});
  $('#btn_logout').click(function(){google_logout();});
});

//Revamped
function get_Info() {
	
	//HelloJS network identifier
	var google = hello('google');
	
//main function execution
google.login({
    scope: 'email',
    force: true
}).then(function() {
    return google.api('me/permissions');
}).then(function(r) {
    if (r.data.filter(function(item) {
        return item.permission === 'email' && item.status !== 'granted'
    }).length) {
        throw new Error('missing permissions');
    }
    else {
        return google.api('me');
    }
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
