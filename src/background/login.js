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
    if (request.text === "login") {
        googleLogin();
        sendResponse({text:'using google+ login'})
    }
});

// handle the 'logout' button on historyMap
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.text === "logout") {
        hello('google').logout();
        localStorage.clear();
        sendResponse({text:'google+ logged out'})
    }
});

// Listens to Login requests and executes functions upon verification
hello.on('auth.login', function (r) {

    // Get Profile
    hello(r.network).api('/me').then(function (user) {
        chrome.runtime.sendMessage({ text: 'loggedin', user: user });
    });
});

chrome.runtime.onMessage.addListener(function (request) {
    if (request.text === 'checkLogin') {
        checkLogin();
    }
});