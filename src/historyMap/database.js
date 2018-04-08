let DBnodes = [];
let UserProfile;
let ProfileName;
let up;
let UserEmail;
let APIKey;

let db = historyMap.database;

function User (name, profile, email) {
    this.name = name;
    this.profile = profile;
    this.email = email;
}

db.user = {

    profile: {},
    
    addUser: function(user) {
        
        this.profile = user;

        var newUser = {
            "name": user.name,
            "email": user.email,
            "info": JSON.stringify(Object.values(user)), // why use object.values()?
        };
    
        // Adding the User to the DB
        var url = baseURL + "userinsert/";
        var json = JSON.stringify(newUser);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            var users = JSON.parse(xhr.responseText);
            historyMap.API.DBLoad.getUACKey();
        }
        xhr.send(json);
    }
}

//Gets Info direct from login instead of local storage (thank you kai, used your code to make it work)
//However, with this new logic, it only sends those via authentication. Authentication now runs onload.
//I think we should make a "Create Session Button". 
//This will initialize and setup the backend and ask the user to login
chrome.runtime.onMessage.addListener(function (request) {
    if (request.text === 'loggedin') {
        
        // ProfileName = request.user.name;
        // up = request.user;
        // UserEmail = request.user.email;

        // historyMap.API.DBSave.DBaddUser();
        db.user.addUser(request.user);
    }
});

//API (Save and Load) specific Variables
var baseURL = "https://sensemap-api.herokuapp.com/";
let DBSessionPointer;

//gets UACkey from DB // will be moved to historyMap.model
historyMap.API.DBLoad.getUACKey = function () {

    //adjusted route
    var url = baseURL + "userGenerateAccessKey/" + UserEmail + "/";
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "200") {
            //adjusted field name to accesskey 
            APIKey = users.accesskey;
            localStorage.setItem("APIKey", APIKey);
            localStorage.setItem("UserEmail", UserEmail);
            historyMap.API.DBLoad.loadUserSessions();
            btnDisplay();
        } else {}
    }
    xhr.send();
}

historyMap.API.DBSave.pushSessToDB = function () {
    var url = baseURL + "session/" + UserEmail + "/" + APIKey;
    var data = {};
    data.name = SessionName;
    var json = JSON.stringify(data);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "201") {} else {
            var indexNo = users["sessions"].length - 1;
            DBSessionPointer = users["sessions"][indexNo]._id;
            UserProfile = users["sessions"];
        }
    }
    xhr.send(json);
}

historyMap.API.DBSave.DBaddUser = function () {
    //Creating the Object for the DB
    var new_stuff = {
        "name": up.name,
        "email": up.email,
        "info": JSON.stringify(Object.values(up)),
    };

    // Adding the User to the DB
    var url = baseURL + "userinsert/";
    var json = JSON.stringify(new_stuff);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        historyMap.API.DBLoad.getUACKey();
    }
    xhr.send(json);
}

historyMap.API.DBSave.Node2DB = function () {

    //gets HistoryMapTree
    let currentTree = historyMap.model.tree;
    var url = baseURL + "sessionupdate/" + DBSessionPointer + "/" + APIKey + "/";
    var json = CircularJSON.stringify(currentTree);
    // console.log(json);
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-type', 'text/plain; charset=utf-8');
    xhr.onload = function () {
        var users = xhr.responseText;
        if (xhr.readyState == 4 && xhr.status == "200") {
            console.table(users);
        } else {
            console.error(users);
        }
    }
    xhr.send(json);
}