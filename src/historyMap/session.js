// Made by Reday Yahya | @RedayY
// JavaScript Document for Save and Load Control

let SessionName;
let SessionProfile;
// let SessionCount = 1;

let recording = true; // whether new noded is added to historymap or not
let loggedIn = false; // whether user is logged in
let sessions = historyMap.model.sessions.getSessions(); // store the list of user sessions
sessions = ['session1','session2','session3','session4','session5']; // for dev only when no session data is retrieved from API

$(function () {
    $('#btn_start').click(function () {
        recording = true;
        btnDisplay();
    });
    $('#btn_pause').click(function () {
        recording = false;
        btnDisplay();
    });
    $('#btn_new').click(function () {
        newHistoryMap();
    });
    $('#btn_load').click(function () {
        displaySessions();
    });
    $('#btn_new_sess').click(function () {
        newSession();
    });
    $('#btn_logout').click(function () {
        chrome.runtime.sendMessage({
            text: 'logout',
            function (response) {
                console.log('response from login.js', response.text);
            }
        });
        location.reload();
        loggedIn = false;
        btnDisplay();
    });
    $('#btn_login').click(function () {
        // run hello.js google+ login
        chrome.runtime.sendMessage({
            text: 'login',
            function (response) {
                console.log('response from login.js', response.text);
            }
        });
    })
});

window.onload = function () {

    if (localStorage.getItem('user') !== null) {
        loggedIn = true; // not always, user may still need to enter the password
        historyMap.model.user = JSON.parse(localStorage.getItem('user'));
    }

    btnDisplay();
    // load_MySession();
    // document.getElementById("myNav").style.width = "100%";
}

chrome.runtime.onMessage.addListener(function (request) {
    if (request.text === 'loggedin') {
        loggedIn = true;
        historyMap.model.user = request.user;
        btnDisplay();
    }
});

function btnDisplay() {

    // make only the relevant button visible

    if (recording) {
        document.getElementById("btn_start").style.display = "none";
        document.getElementById("btn_pause").style.display = "initial";
    } else {
        document.getElementById("btn_start").style.display = "initial";
        document.getElementById("btn_pause").style.display = "none";
    }

    if (loggedIn) {
        document.getElementById("btn_login").style.display = "none";
        document.getElementById("btn_logout").style.display = "initial";
        document.getElementById('userImage').style.display = "initial";
        userImage.src = historyMap.model.user.image.url;

        //checks if User has Sessions Saved, displays load if true
        if (sessions.length == 0){
            document.getElementById("btn_load").style.display = 'none';
        }
        else{
            document.getElementById("btn_load").style.display = 'initial';
        }

    } else {
        document.getElementById("btn_login").style.display = "initial";
        document.getElementById("btn_logout").style.display = "none";
        document.getElementById("btn_load").style.display = "none";
        document.getElementById('userImage').style.display = "none";
    }
}

function newHistoryMap() {
    var confirmation = confirm("Do you want to start a new session? All the progress will be lost if you are not logged in.")

    // this message box will be updated so depends on whether user is logged in or not, different message and options (such as 'enter session name' or 'login') will be displayed.

    if (confirmation) {

        historyMap.model.nodes.empty();

        if (loggedIn) {
            // so user can't create press the 'new' button more than once.
            document.getElementById('btn_new').disabled = true;

            // add a text field
            var input = document.createElement('input');
            input.type = 'text';
            var today = new Date();
            //input.placeholder = today;
            input.value = today.getFullYear() + '-' + (today.getMonth() + 1)  + '-' + today.getDate() + '-' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
            input.id = 'sessionName';
            document.getElementById('settings').appendChild(input);
            input.focus();

            // add a button
            var button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = 'Create';
            button.id = 'btn_new_sess';
            document.getElementById('settings').appendChild(button);
        }
    }
}

function displaySessions() {

    let sessionContainer = document.createElement('div');
    sessionContainer.id = 'sessionContainer';

    let sessionList = document.createElement('ul');
    sessionList.id = 'sessionList';

    sessionContainer.appendChild(sessionList);

    for (var i = 0; i < sessions.length; i++) {
        
        // var paragraph = document.createElement('p');
        
        var listItem = document.createElement('li');
        listItem.innerHTML = sessions[i];

        sessionList.appendChild(listItem);
    }
    document.getElementById('settings').appendChild(sessionContainer);
    $("#sessionList").selectable();
}

function newSession() {
    var SessionName = document.getElementById('sessionName').value;

    console.log(SessionName);
    console.log("TESTING IF IT LINKS");

    
    //Starts up API and prepares Session
    pushToDB();
    pushSessToDB();

    //sends message asking to start recording for the session
    chrome.runtime.sendMessage({text:'sessionstart'});

}


// DB LOAD Document
// Made by Reday Yahya | @RedayY
// Functions for Loading are found in this document

function load_MySession() {

    var url = baseURL + "session/" + UserEmail + "/" + APIKey;
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "200") {

            //picking out Session Information from User Account
            SessionProfile = users["sessions"];
            SessionCount = users["sessions"].length - 1;

            // // Managing generated HTML Elements
            // var Div = document.getElementById("Select-Option");
            // var selectList = document.createElement("select");
            // selectList.id = "mySelect";
            // Div.appendChild(selectList);

            // // Looping thorugh Data and generating selects
            // for (var i = 0; i <= SessionCount; i++) {

            //     // Generating Option for Select List in combination of Data
            //     var option = document.createElement("option");
            //     option.value = SessionProfile[i]._id;
            //     option.text = SessionProfile[i].sessionname;
            //     selectList.appendChild(option);
            // }

            //Managing generated HTML Elements RADIO BUTTON
            var Div = document.getElementById("Select-Option");
            //var selectList = document.createElement("select");
            //selectList.id = "mySelect";
            //Div.appendChild(selectList);

            // Looping thorugh Data and generating selects
            for (var i = 0; i <= SessionCount; i++) {

                // Generating Option for Select List in combination of Data RADIO BOX VERSION
                var option = document.createElement("input");
                option.type = "radio";
                option.value = SessionProfile[i]._id;
                option.name = SessionProfile[i].sessionname;
                Div.appendChild(option);
                Div.append(SessionProfile[i].sessionname);
            }

            // End of Radio Button Version
        } else {

            window.alert("You do not have any saved sessions under this Account");

        }
    }
    xhr.send(null);
}

function load_Select_Session() {

    select_Val = document.getElementById("mySelect").value;
    for (var i = 0; i < SessionProfile.length; i++) {
        if (SessionProfile[i]._id == select_Val) {

            var result = SessionProfile[i];
            load_SelectedSession(result);

            //remove menu
            SessionName = result.sessionname;
            SessionReady = true;
            document.getElementById("myNav").style.width = "0%";
            startAPI();
        }
    }

}

//create session
function load_session() {

    var sesReq = prompt("Please enter a Session Name");
    if (sesReq == null || sesReq == "" || sesReq == " ") {
        window.alert("Please enter a suitable Session ID");
        load_Session();
    } else {
        searchSessionName = sesReq;
        //code to load session goes here
        window.alert("Loaded Session Name: " + searchSessionName);
    }

}

function load_SelectedSession(i) {
    nodes.length = 0;
    nodes = i.nodes;
    historyMap.view.redraw();
}