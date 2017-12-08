// Made by Reday Yahya | @RedayY
// JavaScript Document for Save and Load Control

let SessionName;
let SessionProfile;
let SessionCount;

let recording = true; // whether new noded is added to historymap or not
let loggedIn = false; // whether user is logged in

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
        reset_sense();
    });
    $('#btn_load').click(function () {
        load_Select_Session();
    });
    $('#btn_logout').click(function () {
        google_Logout();
        localStorage.clear();
        window.close();
    });
    $('#btn_login').click(function () {
        // run hello.js google+ login 
    })
});

window.onload = function () {
    btnDisplay();
    load_MySession();
    // document.getElementById("myNav").style.width = "100%";
}

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

        // (toBeComplete) if user has saved sessions, load button is visible, else;
        document.getElementById("btn_load").style.display = 'none';
    }
    else {
        document.getElementById("btn_login").style.display = "initial";
        document.getElementById("btn_logout").style.display = "none";
        document.getElementById("btn_load").style.display = "none";        
    }

    // if history map is empty, 'new' button is hidden.
    if (historyMap.model.nodes.getArray.length === 0) {
        document.getElementById("btn_new").style.display = 'none';
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