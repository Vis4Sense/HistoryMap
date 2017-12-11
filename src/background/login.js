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
    }).then(function () {
        return google.api('me');
    })
};

// handle the 'login' button on historyMap
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.text === "login") {
        googleLogin();
        sendResponse({text:'using google+ login'})
    } else {
        sendResponse({text:'do not understand the message' + request.text});
    }
});

// handle the 'logout' button on historyMap
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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

        // btn_format();
        // AccLoggedIn = true;
        // UserEmail = user.email;
        // localStorage.setItem("UserEmail", user.email);
        // UserProfile = user;
        // getUACKey();  // this should be in session.js
        // saveProfile();
        // document.dispatchEvent(DOMContentLoaded);
        // openSensemap();

        // On chrome apps we're not able to get remote images
        // This is a workaround
        // if (typeof (chrome) === 'object') {
        //     img_xhr(label.getElementsByTagName('img')[0], user.thumbnail);
        // }
    });
});

//gets UACkey from DB
function getUACKey() {
    // Update a user
    var url = baseURL + "userGenerateAccessKey/" + UserEmail + "/";
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "200") {
            // console.table(users);
            // console.log(users.accessKey);
            UserAccessKey = users.accessKey;
            localStorage.setItem("UserAccessKey", UserAccessKey);
        } else {
            // console.error(users);
            UserAccessKey = users.accessKey;
            localStorage.setItem("UserAccessKey", UserAccessKey);
        }
    }
    xhr.send();
}

function openSensemap() {
    chrome.windows.create({
        'url': '/src/historyMap/historyMap.html',
        'type': 'popup'
    }, function (window) {});
};