//Made by Reday Yahya | @RedayY
//Sensemap Sinnon and Jasmine Testing Specification Document
//Unit Testing for Login

/*
Notes:
Checks for the Login Object to be what I expect it to be 
Async Testing is something I would like to try out at one point. However it is not neccecary.
*/

describe("Unit Testing Suit for Login", function () {

    it('It should give us usable data for the login. | Testing: Login Object', function() {

        //Constructing Tab Information
        const loginInfo = {
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
        };

        //Log Info
        console.log(loginInfo);

        expect(loginInfo.first_name).toBe("Ray");
        expect(loginInfo.last_name).toBe("Yahya");
        expect(loginInfo.email).toBe("sniperzpkz@googlemail.com");


    });  
});