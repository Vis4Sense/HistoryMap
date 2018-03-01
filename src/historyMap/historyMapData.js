historyMap.model.nodes = {

    nodes: [],

    getNode: function (index) {
        return this.nodes[index];
    },

    getNodeIndex: function (node) {
        return this.nodes.indexOf(node);
    },

    addNode: function (node) {
        var index = this.nodes.push(node);
        historyMap.view.redraw();
        return index;
    },

    updateNode: function (index, node) {
        var result = (this.nodes[index] = node);
        historyMap.view.redraw();
        return result;
    },

    getArray: function () {
        return this.nodes;
    },

    getSize: function () {
        return this.nodes.length;
    },

    empty: function () {
        this.nodes.length = 0;
        historyMap.view.redraw();
    }
}

historyMap.model.sessions = {
    sessions: [],

    getSessions: function() {
        return this.sessions;
    }
};

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

let DBnodes = [];
let UserProfile;
let ProfileName;
let up;
let UserEmail;
let APIKey;

//Gets Info direct from login instead of localstorage (thank you kai, used your code to make it work)
//However, with this new logic, it only sends thoose via autentification. Authentification now runs onload.
//I think we should make a "Create Session Button". 
//This will initialize and setup the backend and ask the user to login
chrome.runtime.onMessage.addListener(function (request) {
    if (request.text === 'loggedin') {
        ProfileName = request.user.name;
        up = request.user;
        UserEmail = request.user.email;
        DBaddUser();
    }
});

//API (Save and Load) specific Variables
var baseURL = "https://sensemap-api.herokuapp.com/";
let DBSessionPointer;

//gets UACkey from DB // will be moved to historyMap.model
function getUACKey() {

    //adjusted route
    var url = baseURL + "userGenerateAccessKey/" + UserEmail + "/";
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        console.log(users);
        if (xhr.readyState == 4 && xhr.status == "200") {
            //adjusted field name to accesskey 
            APIKey = users.accesskey;
            localStorage.setItem("APIKey", APIKey);
            localStorage.setItem("UserEmail", UserEmail);
            load_user_sessions();
            btnDisplay();
        } else {
        }
    }
    xhr.send();
}

function pushSessToDB() {
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

function DBaddUser() {
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
        //might be worth calling the UAC here
    }
    xhr.send(json);
}

function Node2DB() {

    //gets node count and fetches the last node
    let nodeCount = historyMap.model.nodes.getSize() - 1;
    let lastNode = nodes[nodeCount];

    //pushes node to DB
    if (recording) {

        //node visibility changes upon state of "Recording Setting"

        lastNode.visibility = true;

        var new_node = {
            "info": JSON.stringify(Object.values(lastNode))
        };

        var url = baseURL + "node/" + DBSessionPointer + "/" + APIKey;
        var json = JSON.stringify(new_node);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            var users = JSON.parse(xhr.responseText);
        }
        xhr.send(json);
    } else {

        if (!recording) {
            //node visibility changes upon state of "Recording Setting"
            lastNode.visibility = false;

            var new_node = {
                "info": JSON.stringify(Object.values(lastNode))
            };

            var url = baseURL + "node/" + DBSessionPointer + "/" + APIKey;
            var json = JSON.stringify(new_node);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            xhr.onload = function () {
                var users = JSON.parse(xhr.responseText);
            }
            xhr.send(json);
        }
    }
}

