//Profile specific Variables
let UserEmail;
let UserProfile;
let DBnodes = [];
let ProfileName = "";
let ProfilePicture = "";
let AccLoggedIn = false;
let UserAccessKey;
var baseURL = "https://sensemap-api.herokuapp.com/";

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method = "HistoryMapLogout") {
        sendResponse(AccLoggedIn = false);
    } else {
        sendResponse({});
    }
});

//Hello.js Initialization spec
hello.init({
    google: '216563153005-rf4vuggusohpth9qm5korfclfo8lah39.apps.googleusercontent.com'
}, {
    redirect_uri: 'https://' + chrome.runtime.id + '.chromiumapp.org/src/background/background.html'
})

//login function
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

//localstorage save function
function saveProfile() {
    localStorage.setItem("UserProfile", JSON.stringify(UserProfile));
    if (localStorage.getItem('ProfileName') === null) {

        //stores Image and Profile E-Mail in localstorage
        profilename = UserProfile.name;
        profileimg = UserProfile.thumbnail;
        console.log(profilename + " " + profileimg)
        localStorage.setItem("ProfileName", profilename);
        localStorage.setItem("ProfileIMGURL", profileimg);

    } else {
        ProfileName = localStorage.getItem('ProfileName');
        ProfilePicture = localStorage.getItem('ProfileIMGURL');
        document.getElementById("networkName").innerHTML = "<p>" + ProfileName + "</p>";
        document.getElementById("Image").innerHTML = "<img src='" + ProfilePicture + "'id='profileIMG'/>";
    }
}

// Listens to Login requests and executes functions upon verification
hello.on('auth.login', function (r) {

    // Get Profiles
    hello(r.network).api('/me').then(function (p) {

        // btn_format();
        AccLoggedIn = true;
        UserEmail = p.email;
        localStorage.setItem("UserEmail", p.email);
        UserProfile = p;
        getUACKey();
        saveProfile();
        // document.dispatchEvent(DOMContentLoaded);
        openSensemap();

        // On chrome apps we're not able to get remote images
        // This is a workaround
        if (typeof (chrome) === 'object') {
            img_xhr(label.getElementsByTagName('img')[0], p.thumbnail);
        }
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