//Made by Reday Yahya | @RedayY
//Sensemap Sinnon and Jasmine Testing Specification Document
//Unit Testing for Login/Registration

/*
Notes:
Checks for the Login Object to be what I expect it to be 
ReVamped version 2.0, includes full login now without sinon, because sinon has some issues with hellojs
*/


describe("Unit Testing Suit for Login", function (done) {

    hello.init({
        google: '216563153005-rf4vuggusohpth9qm5korfclfo8lah39.apps.googleusercontent.com'
    }, {
        redirect_uri: 'https://' + chrome.runtime.id + '.chromiumapp.org/tests/Reday/tests.jasmine.html'
    });


    beforeAll(function (done) {

        var loggedin = false;
        var fullName;

        google_login();

        hello.on('auth.login', function (r) {
            // Get Profile
            hello(r.network).api('/me').then(function (p) {
                console.log(p);
                var loggedin = true;
                var fullName = p.name;
                done();
            });
        });
    });

    it('It should give us usable data for the login. | Testing: Login Object', function () {
        expect(loggedin).toBe(true);
        expect(fullname).toBe("James Mowkito");
        //end of it    
    });

    //end of suit
});











// beforeAll(function(done) {

//     var loggedin = false;
//     var fullName;

//     google_Login();

//     hello.on('auth.login', function (r) {
//         // Get Profile
//         hello(r.network).api('/me').then(function (p) {
//             console.log(p);
//             var loggedin = true;
//             var fullName = p.name;
//             done();
//             });
//         });

// it('It should give us usable data for the login. | Testing: Login Object', function() {
//     expect(loggedin).toBe(true);
//     expect(fullname).toBe("James Mowkito");
//     //end of it    
// });