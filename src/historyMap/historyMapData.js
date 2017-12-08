historyMap.model.nodes = {

    nodes: [],

    getNode: function (index) {
        return this.nodes[index];
    },

    addNode: function (node) {
        return this.nodes.push(node);
    },

    updateNode: function (index, node) {
        return this.nodes[index] = node;
    },

    getArray: function () {
        return this.nodes;
    }

}

function Node(id, tabId, time, url, title, favIconUrl, parentTabId, from) {
    this.id = id;
    this.tabId = tabId;
    this.time = time;
    this.url = url;
    this.text = title;
    this.favIconUrl = favIconUrl;
    this.parentTabId = parentTabId;
    this.from = from;
}

// DB SAVE Document
// Made by Reday Yahya | @RedayY
// Functions for Saving are found in this document

//Profile specific Variables
let AccLoggedIn;
let DBnodes = [];
let UserProfile;
let ProfileName = localStorage.getItem('ProfileName');

//API (Save and Load) specific Variables
var baseURL = "https://sensemap-api.herokuapp.com/";
let up = JSON.parse(localStorage.getItem('UserProfile'));
let UserEmail = localStorage.getItem("UserEmail");
let APIKey = localStorage.getItem("UserAccessKey");
let apiinput;
let DBSessionPointer;
let SessionReady = false;

//execute save and load functionality only if the user is logged in simulation
function startAPI() {
    if (up != null && SessionReady == true) {
        pushToDB();
        pushSessToDB();
    }
}


$(function () {
    $('#new_session').click(function () {
        askForSession();
    });
    $('#closebtn').click(function () {
        document.getElementById("myNav").style.width = "0%";
    });
});

function askForSession() {

    var NewSessionName = document.getElementById("NewSessionName").value;
        SessionName = NewSessionName;
        window.alert("Using Session Name: " + SessionName);
        SessionReady = true;
        document.getElementById("myNav").style.width = "0%";
        startAPI();
    
}

function pushSessToDB() {
    var url = baseURL + "session/" + UserEmail + "/" + APIKey;
    var data = {};
    data.sessionname = SessionName;
    var json = JSON.stringify(data);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "201") {} else {
            //debug
            var indexNo = users["sessions"].length - 1;
            DBSessionPointer = users["sessions"][indexNo]._id;
            UserProfile = users["sessions"];
        }
    }
    xhr.send(json);
}

function add_user_to_db() {
    //Creating the Object for the DB

    var new_stuff = {
        "name": up.name,
        "emailAddress": up.email,
        "addtionalinfo": JSON.stringify(Object.values(up)),
    };

    // Adding the User to the DB
    var url = baseURL + "userinsert";
    var json = JSON.stringify(new_stuff);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
    }
    xhr.send(json);

}

function pushToDB() {

    //Creating the Object for the DB
    var UserProfileObject = {
        "name": up.name,
        "emailAddress": up.email,
        "addtionalinfo": Object.values(up)
    };

    //Crucial Bit that Adds the User to the DB, if the user has something on the DB, do not add at all cost.
    //Code is based on Shaz example

    //check if email is in db
    var url = baseURL + "userbyemail/" + up.email + "/" + APIKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "200") {
            if (users.length == 0) {
                add_user_to_db();
            }
        } else {
            console.log("Could not perform action")
        }
    }
    xhr.send(null);
}

function Node2DB(node) {

    if (recording) {

        node.visibility = false;
        var url = baseURL + "node/" + DBSessionPointer + "/" + APIKey;
        var json = JSON.stringify(node);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            var users = JSON.parse(xhr.responseText);
        }
        xhr.send(json);
    } else {

        if (!recording) {
            node.visibility = truenode.visibility = true;
            var url = baseURL + "node/" + DBSessionPointer + "/" + APIKey;
            var json = JSON.stringify(node);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            xhr.onload = function () {
                var users = JSON.parse(xhr.responseText);
            }
            xhr.send(json);
        }
        //debug
        console.log("did not add node");
    }

    return node;
}

historyMap.model.sessions = {
    sessions: [],
};