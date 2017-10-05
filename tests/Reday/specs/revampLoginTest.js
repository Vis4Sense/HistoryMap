//Made by Reday Yahya | @RedayY
//Sensemap Sinnon and Jasmine Testing Specification Document
//Unit Testing for Login/Registration

/*
Notes:
Checks for the Login Object to be what I expect it to be 
ReVamped version, includes full login 
*/

describe("Unit Testing Suit for Login", function () {

    //Start login
    beforeEach(function () {

        hello.init({
            google: '216563153005-rf4vuggusohpth9qm5korfclfo8lah39.apps.googleusercontent.com'
        }, {
            redirect_uri: 'https://' + chrome.runtime.id + '.chromiumapp.org/Reday/tests.sinon.html'
        });

        hello('google').login({
            scope: 'email',
            force: true
        }).then(function () {
            return google.api('me');
        })
    });
    
    //End Logout
    afterEach(function () {
        hello('google').logout();
    });

    it('It should give us usable data for the login. | Testing: Login Object', function () {

        var loggedin = false;
        var fullName;

        hello.on('auth.login', function (r) {
            // Get Profile
            hello(r.network).api('/me').then(function (p) {
                // pushToDB();
                var loggedin = true;
                var fullName = p.name;
            });
        });

        expect(loggedin).toBe(true);
        expect(fullname).toBe("James Mowkito");
        //end of it    
    });

    //end of suit
});