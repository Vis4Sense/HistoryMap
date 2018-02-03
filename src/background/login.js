//Profile specific Variables
// let UserEmail;
// let UserProfile;
// let DBnodes = [];
// let ProfileName = "";
// let ProfilePicture = "";
// let AccLoggedIn = false;
// let UserAccessKey;
// var baseURL = "https://sensemap-api.herokuapp.com/";
// everything related to the backend should be in the historyMap (such as session.js)


//Hello.js Initialization spec
hello.init({
    google: '216563153005-rf4vuggusohpth9qm5korfclfo8lah39.apps.googleusercontent.com'
}, {
    redirect_uri: 'https://' + chrome.runtime.id + '.chromiumapp.org/src/background/background.html'
})

//login function
function googleLogin() {
    // HelloJS network identifier
    var google = hello('google');

    // Forcing E-Mail out of profile Object
    google.login({
        scope: 'email',
        force: true
        // maybe add here the configuration that do not remember password
    }).then(function () {
        return google.api('me');
    })
};

// handle the 'login' button on historyMap
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    //issue #97 cause identified here 
    console.log("login got a message " + JSON.stringify(request)); 
    if (request.text === "login") {
        googleLogin();
        sendResponse({text:'using google+ login'})
    } else {
        sendResponse({text:'do not understand the message' + request.text});
    }
});

// handle the 'logout' button on historyMap
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("login got a message " + JSON.stringify(request)); 
    if (request.text === "logout") {
        hello('google').logout();
        localStorage.clear();
        sendResponse({text:'google+ logged out'})
    } else {
        sendResponse({text:'do not understand the message' + request.text});
    }
});

// Listens to Login requests and executes functions upon verification
hello.on('auth.login', function (r) {

    // Get Profiles
    hello(r.network).api('/me').then(function (user) {

        localStorage.setItem('user',JSON.stringify(user));

        chrome.runtime.sendMessage({text:'loggedin',user: user});

        //chrome.runetime.sendmessage({text:'logininfo',user: user});

        // btn_format();
        // AccLoggedIn = true;
        // UserEmail = user.email;
        // localStorage.setItem("UserEmail", user.email);
        // UserProfile = user;
        // getUACKey();  // this should be in session.js
        // saveProfile();
        // document.dispatchEvent(DOMContentLoaded);
        // openSensemap();
    });
});
