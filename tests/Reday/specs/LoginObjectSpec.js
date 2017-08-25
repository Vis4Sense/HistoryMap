//Made by Reday Yahya | @RedayY
//Sensemap Sinnon and Jasmine Testing Specification Document
//Unit Testing for Login

/*
Notes:
Checks for the Login Object to be what I expect it to be 
Async Testing is something I would like to try out at one point. However it is not neccecary.
I am using a github example https://gist.github.com/cjohansen/739589 \ 
// ^ thank you it helps me understand a litte bit better
*/

describe("Unit Testing Suit for Login", function () {

    //Start Server before Function
    beforeEach(function() {
        server = sinon.fakeServer.create();
    });

    //End Server after Function
    afterEach(function () {
        server.restore();
  });

    it('It should give us usable data for the login. | Testing: Login Object', function() {

        /* Line breaken Object

            "kind":"plus#person",
            "etag":"\"Sh4n9u6EtD24TM0RmWv7jTXojqc/kUFcp_n8srqE-liygjZ05ntfLf4\"",
            "gender":"male",
            "emails":[{"value":"sniperzpkz@googlemail.com","type":"account"}],
            "objectType":"person",
            "id":"100742203001759045897",
            "displayName":"Ray Yahya",
            "name":"Ray Yahya",
            "url":"https://plus.google.com/100742203001759045897",
            "image":{"url":"https://lh4.googleusercontent.com/-Mt2hkiP5BV8/AAAAAAAAAAI/AAAAAAAAWyU/WjUB88eY4f0/photo.jpg?sz=50","isDefault":false},
            "isPlusUser":true,
            "language":"de",
            "circledByCount":5,
            "verified":false,
            "last_name":"Yahya",
            "first_name":"Ray",
            "email":"sniperzpkz@googlemail.com",
            "picture":"https://lh4.googleusercontent.com/-Mt2hkiP5BV8/AAAAAAAAAAI/AAAAAAAAWyU/WjUB88eY4f0/photo.jpg?sz=50","thumbnail":"https://lh4.googleusercontent.com/-Mt2hkiP5BV8/AAAAAAAAAAI/AAAAAAAAWyU/WjUB88eY4f0/photo.jpg?sz=50"
        */

    //server fake request
    server.respondWith("GET", "/something",
                [200, { "Content-Type": "application/json" },
                    '{"kind":"plus#person","etag":"\"Sh4n9u6EtD24TM0RmWv7jTXojqc/TxFVR2WoyGFdFoAfTOpGIRtcEJ0\"","emails":[{"value":"jamesmowkito@gmail.com","type":"account"}],"objectType":"person","id":"106780643953396250439","displayName":"James Mowkito","name":"James Mowkito","image":{"url":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","isDefault":true},"isPlusUser":false,"language":"en","verified":false,"last_name":"Mowkito","first_name":"James","email":"jamesmowkito@gmail.com","picture":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","thumbnail":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50"}']);
    
       //Spying on Callbacks
    var callbacks = [sinon.spy(), sinon.spy()];

    jQuery.ajax({
      url: "/something",
      success: callbacks[0]
    });

    jQuery.ajax({
      url: "/other",
      success: callbacks[1]
    });

    console.log(server.requests); // Logs all requests so far
    server.respond(); // Process all requests so far

    //checks if the it has been called
    expect(callbacks[0].calledOnce).toBeTruthy();

    //checks information called and returned
    expect(callbacks[0].calledWith({
      first_name: "James",
      last_name: "Mowkito"
    })).toBeTruthy();

    });  
});