function Node(id, tabId, time, url, title, favIconUrl, from, isTabOpen) {
    this.id = id;
    this.tabId = tabId;
    this.time = time;
    this.url = url;
    this.text = title;
    this.favIconUrl = favIconUrl;
    this.from = from;
    this.isTabOpen = isTabOpen; // whether the browser tab showing the node URL is open
}

historyMap.model.nodes = {

    nodeArray: [],

    getNode: function (index) {
        return this.nodeArray[index];
    },

    getNodeIndex: function (node) {
        return this.nodeArray.indexOf(node);
    },

    addNode: function (node) {
        var index = this.nodeArray.push(node);
        historyMap.view.redraw();
        return index;
    },

    updateNode: function (index, node) {
        var result = (this.nodeArray[index] = node);
        historyMap.view.redraw();
        return result;
    },

    getArray: function () {
        return this.nodeArray;
    },

    getSize: function () {
        return this.nodeArray.length;
    },

    empty: function () {
        this.nodeArray.length = 0;
        historyMap.view.redraw();
    },

    hideNode: function (tabUrl, classId) {
        //locates the original highlight(note), marks it as hidden
        var foundNode = this.nodeArray.find(a => (a.url === tabUrl) && (a.classId === classId));
        foundNode.hidden = true;
        return foundNode;
    },

    updateType: function (typeUpdate) {
        //locates the original highlight(note), updates its text and/or type
        if (typeUpdate.type === 'note') {
            var foundNode = this.nodeArray.find(a => a.classId === typeUpdate.classId)
            foundNode.text = typeUpdate.text;
            foundNode.type = typeUpdate.type;
            return foundNode;
        }
    }
}

function Tab(tabId, node, isCompleted) {
    this.tabId = tabId;
    this.node = node; // the latest node for this tab
    this.isCompleted = isCompleted;
}

historyMap.model.tabs = {

    tabArray: [], // store the tabs that are currently open

    addTab: function(tab) {
        return this.tabArray.push(tab);
    },

    getArray: function() {
        return this.tabArray;
    },

    getTab: function(tabId) {
        return this.tabArray.find(item => item.tabId == tabId);
    },
}

historyMap.model.sessions = {
    sessions: [],

    getSessions: function () {
        return this.sessions;
    }
};



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
        historyMap.API.DBSave.DBaddUser();
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