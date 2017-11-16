// Made by Reday Yahya | @RedayY
// JavaScript Document for Save and Load Control

let SessionName;
let UserRecord = true;

$(function () {
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


window.onload = function () {
    btn_pause_start_conf();
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