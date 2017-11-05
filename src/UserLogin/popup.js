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
        localStorage.clear();
    });
});

//Profile specific Variables
let UserRecord = true;
let UserEmail;
let UserProfile;
let DBnodes = [];
let ProfileName = "";
let ProfilePicture = "";

//API (Save and Load) specific Variables
let baseURL = "https://sensemap-api.herokuapp.com/";
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

// Listens to Login requests and executes functions upon verification
hello.on('auth.login', function (r) {

    // Get Profiles
    hello(r.network).api('/me').then(function (p) {

        btn_format();
        AccLoggedIn = true;
        UserEmail = p.email;
        UserProfile = p;
        saveProfile();


        // On chrome apps we're not able to get remote images
        // This is a workaround
        if (typeof (chrome) === 'object') {
            img_xhr(label.getElementsByTagName('img')[0], p.thumbnail);
        }
    });
});


function openSensemap() {
    chrome.windows.create({
        'url': 'src/historyMap/historyMap.html',
        'type': 'popup'
    }, function (window) {});
};

window.onload = function button_config() {
    saveProfile();
    btn_reset();
    //btn_pause_start_conf();
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
    document.getElementById("btn_logout").style.color = "red";
}

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



function saveProfile() {

    if (localStorage.getItem('ProfileName') === null) {

        //stores Image and Profile E-Mail in localstorage

        profilename = UserProfile.name;
        profileimg = UserProfile.thumbnail;
        console.log(profilename + " " + profileimg)

        localStorage.setItem("ProfileName", profilename);
        localStorage.setItem("ProfileIMGURL", profileimg);

        draw_profile();

    } else {

        ProfileName = localStorage.getItem('ProfileName');
        ProfilePicture = localStorage.getItem('ProfileIMGURL');

        document.getElementById("networkName").innerHTML = "<p>" + ProfileName + "</p>";
        document.getElementById("Image").innerHTML = "<img src='" + ProfilePicture + "'id='profileIMG'/>";

    }
}


var little_helper = 'https://' + chrome.runtime.id + '.chromiumapp.org/src/UserLogin/popup.html';