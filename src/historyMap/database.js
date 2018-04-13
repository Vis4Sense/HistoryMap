let DBnodes = [];
let db = historyMap.database;

function User(name, profile, email) {
    this.name = name;
    this.profile = profile;
    this.email = email;
}

db.user = {

    profile: {},

    addUser: function (user) {

        this.profile = user;

        var newUser = {
            "name": user.name,
            "email": user.email,
            "info": JSON.stringify(user),
        };

        // Adding the User to the DB
        var url = baseURL + "userinsert/";
        var json = JSON.stringify(newUser);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            var users = JSON.parse(xhr.responseText);
            historyMap.database.user.getUACKey();
        }
        xhr.send(json);
    }

}


//Use this function to load Sessions into history map, requires Session Data to be used.
historyMap.database.user.setSelectedSession = function () {

    //fetches value from select list
    select_Val = document.getElementById("mySelect").value;
    document.getElementById("mySelect").remove();
    document.getElementById('btn_load').disabled = false;

    for (var i = 0; i => SessionProfile.length; i++) {
        if (SessionProfile[i]._id == select_Val) {
            var result = SessionProfile[i];
            console.log(result);
            historyMap.database.sessions.loadSelectedSession(result);
            break;
        }
    }
}

//Function for loading
historyMap.database.sessions.loadSelectedSession = function (i) {

    //Clear Previous Values
    nodes.length = 0;
    SessionName = "";

    //set new values
    tempTree = CircularJSON.parse(i.nodes);
    historyMap.model.tree = tempTree;

    //reload history map
    historyMapView.width(window.innerWidth).height(window.innerHeight);
    d3.select('.sm-history-map-container').datum(historyMap.model.tree).call(historyMapView);

    //Set Values to Historymap from Session of Choice for save and load
    SessionName = i.name;
    DBSessionPointer = i._id;
};

//Sets Values to HistoryMap.database.user Object
chrome.runtime.onMessage.addListener(function (request) {
    if (request.text === 'loggedin') {
        db.user.addUser(request.user);
    }
});

//API (Save and Load) specific Variables
var baseURL = "https://sensemap-api.herokuapp.com/";
let DBSessionPointer;

//gets UACkey from DB // will be moved to historyMap.model
historyMap.database.user.getUACKey = function () {

    //adjusted route
    var url = baseURL + "userGenerateAccessKey/" + db.user.profile.email + "/";
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "200") {
            //adjusted field name to accesskey 
            historyMap.database.user.APIKey = users.accesskey;
            localStorage.setItem("APIKey", db.user.APIKey);
            localStorage.setItem("UserEmail", db.user.profile.email);
            historyMap.database.sessions.loadUserSessions();
            btnDisplay();
        } else {}
    }
    xhr.send();
}

historyMap.database.user.pushSessToDB = function () {
    var url = baseURL + "session/" + db.user.profile.email + "/" + historyMap.database.user.APIKey;
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
        }
    }
    xhr.send(json);
}

historyMap.database.user.DBaddUser = function () {
    //Creating the Object for the DB
    var new_stuff = {
        "name": db.user.profile.name,
        "email": db.user.profile.email,
        "info": JSON.stringify(Object.values(db.user.profile)),
    };

    // Adding the User to the DB
    var url = baseURL + "userinsert/";
    var json = JSON.stringify(new_stuff);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        historyMap.database.user.getUACKey();
    }
    xhr.send(json);
}

historyMap.database.user.Tree2DB = function () {

    //gets HistoryMapTree
    let currentTree = historyMap.model.tree;
    var url = baseURL + "sessionupdate/" + DBSessionPointer + "/" + historyMap.database.user.APIKey + "/";
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

historyMap.database.user.Node2DB = function () {

    //gets HistoryMapTree
    let currentTree = historyMap.model.tree;
    var url = baseURL + "sessionupdate/" + DBSessionPointer + "/" + historyMap.database.user.APIKey + "/";
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

//Force logout upon closing
window.onbeforeunload = function () {
    chrome.runtime.sendMessage({
        text: 'logout',
        function (response) {
            console.log('response from login.js', response.text);
        }
    });
};