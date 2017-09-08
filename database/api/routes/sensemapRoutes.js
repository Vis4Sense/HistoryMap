'use strict';
module.exports = function(app) {

var userList = require('../controllers/sensemapController');
var key = '3yARG4zzLndmE39Mw00xigqDV3lOrjEJ'; /* 256-bit key requirement. */


	app.all('/', function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "X-Requested-With");
	  next();
	 });

	app.get('/', function(req, res, next) {
	  // Handle the get for this route
	});

	app.post('/', function(req, res, next) {
	 // Handle the post for this route
	});

  app.route('/users/'+key)
    .get(userList.list_all_users)
    .post(userList.create_a_user);

  app.route('/user/:userId'+'/'+key)
    .get(userList.read_a_user)
    .put(userList.update_a_user)
    .delete(userList.delete_a_user);
	
  app.route('/userbyemail/:emailaddress'+'/'+key)
    .get(userList.read_a_user_by_email)
    .put(userList.update_a_user_by_email)
    .delete(userList.delete_a_user_by_email);
	
};