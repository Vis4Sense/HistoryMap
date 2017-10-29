var SessionName;

function askForSession() {
    var UserInput = prompt("Please enter a Session Name");
    if (UserInput == null || UserInput == "" || UserInput == " ") {
        window.alert("Please enter a suitable Session Name");
        askForSession();
    } else {
        SessionName = UserInput;
        window.alert("Using Session Name: " + UserInput);
    }
}

window.onload = function(){
    askForSession();
}