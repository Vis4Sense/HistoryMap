// Made by Reday Yahya | @RedayY
// JavaScript Document for Login Functionality and popup layout control

hello.init({
    google: '216563153005-rf4vuggusohpth9qm5korfclfo8lah39.apps.googleusercontent.com'
}, {
        redirect_uri: 'https://' + chrome.runtime.id + '.chromiumapp.org/src/UserLogin/popup.html'
    })

// Please make sure to update redirect URI to match ur client machine in chrome developer api console.

// Button Functionailty assignment
$(function () {
    $('#btn_login').click(function () {
        google_Login();
    });
    $('#btn_logout').click(function () {
        google_Logout();
    });
    $('#btn_start').click(function () {
        UserRecord = true;
        btn_pause_start_conf();
    });
    $('#btn_pause').click(function () {
        UserRecord = false;
        btn_pause_start_conf();
    });
    $('#btn_new').click(function () {
        reset_sense();
    });
    $('#btn_load').click(function () {
        load_session();
    });
});

//Profile specific Variables
let UserRecord = true;
let UserEmail;
let UserProfile;
let DBnodes = [];

//API (Save and Load) specific Variables
var baseURL = "https://sensemap-api.herokuapp.com/";
let APIKey;
let apiinput;
let DBSessionPointer;


function google_Login() {

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

function google_Logout() {

    var answer = confirm("Logging Out will reload SenseMap, do you wish to Continue?")
    if (answer) {
        hello('google').logout().then(function () {
            alert('Signed out');
            btn_reset();
            LoggedIn = false;
            location.reload();
        }, function (e) {
            alert('Signed out error: ' + e.error.message);
        });
    };
}

function openSensemap() {
    chrome.windows.create({
        'url': 'src/historyMap/historyMap.html',
        'type': 'popup'
    }, function (window) { });
};

window.onload = function button_config() {
    document.getElementById("btn_logout").disabled = true;
    document.getElementById("btn_logout").style.color = "red";
    document.getElementById("btn_login").style.color = "darkmagenta";

    btn_pause_start_conf();

    chrome.tabs.query({
        'url': 'chrome-extension://' + chrome.runtime.id + '/src/historyMap/historyMap.html'
    }, function (results) {
        if (results.length == 0) {
            openSensemap();
        }
    });

};

function btn_reset() {
    document.getElementById("btn_logout").disabled = true;
    document.getElementById("btn_login").style.color = "darkmagenta";
}

function btn_pause_start_conf() {

    if (UserRecord == true) {
        document.getElementById("btn_start").disabled = true;
        document.getElementById("btn_pause").disabled = false;
        document.getElementById("btn_pause").style.color = "darkmagenta";
        document.getElementById("btn_start").style.color = "red";
    } else {
        document.getElementById("btn_pause").disabled = true;
        document.getElementById("btn_start").disabled = false;
        document.getElementById("btn_pause").style.color = "red";
        document.getElementById("btn_start").style.color = "darkmagenta";
    }

}

function reset_sense() {
    var answer = confirm("Would you like to start over again, this do not log you out, does you still wish to Continue?")
    if (answer) {
        location.reload();
    } else {
        window.alert("SenseMap did not restart, carry on!")
    }
}

// Listens to Login requests and executes functions upon verification
hello.on('auth.login', function (r) {

    // Get Profiles
    hello(r.network).api('/me').then(function (p) {

        btn_format();

        var value = "";
        chrome.storage.local.get('Profile-Username', function (result) {
            value = result;
        });


        if (value == "") {

            //stores Image and Profile E-Mail in localstorage

            profilename = p.name;

            chrome.storage.sync.set({ "ProfileName" : profilename  }, function () {
                console.log("Profile Saved in Localstorage :" + profilename)
            });

            draw_profile();

        }

        else {

            var ProfileName = "";
            var ProfilePicture = "";

            chrome.storage.local.get('ProfileUsername', function (result) {
                ProfileName = result;
            });

            chrome.storage.local.get('Profile-Username', function (result) {
                ProfilePicture = result;
            });

            document.getElementById("networkName").innerHTML = "<p>" + ProfileName + "</p>";
            document.getElementById("Image").innerHTML = "<img src='" + ProfilePicture + "'id='profileIMG'/>";

        }

        AccLoggedIn = true;
        UserEmail = p.email;


        // On chrome apps we're not able to get remote images
        // This is a workaround
        if (typeof (chrome) === 'object') {
            img_xhr(label.getElementsByTagName('img')[0], p.thumbnail);
        }
    });
});

function btn_format() {
    document.getElementById("btn_login").disabled = true;
    document.getElementById("btn_logout").disabled = false;
    document.getElementById("btn_logout").style.color = "darkmagenta";
    document.getElementById("btn_login").style.color = "red";
};

function draw_profile() {
    hello('google').api('me').then(function (upp) {
        document.getElementById("networkName").innerHTML = "<p>" + upp.name;
        document.getElementById("Image").innerHTML = "<img src='" + upp.thumbnail + "'id='profileIMG'/>";
    })
}

var little_helper = 'https://' + chrome.runtime.id + '.chromiumapp.org/src/UserLogin/popup.html';