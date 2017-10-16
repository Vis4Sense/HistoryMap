// DB LOAD Document
// Made by Reday Yahya | @RedayY
// Functions for Loading are found in this document

function load_MySession() {

    var url = baseURL + "session/" + UserEmail + APIKey;
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "200") {

            // Managing generated HTML Elements
            var Div = document.getElementById("Select-Option");
            var selectList = document.createElement("select");
            selectList.id = "mySelect";
            Div.appendChild(selectList);

            // Looping thorugh Data and generating selects
            for (var i = 0; i => SessionCount; i++) {

                // Generating Option for Select List in combination of Data
                var option = document.createElement("option");
                option.value = UserProfile[i]._id;
                option.text = UserProfile[i].sessionname;
                selectList.appendChild(option);
            }

        } else {

            window.alert("You do not have any saved sessions under this Account");

        }
    }
    xhr.send(null);
}

function load_Select_Session() {

    select_Val = document.getElementById("mySelect").value;

    var url = baseURL + "node/" + select_Val + APIKey;
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.onload = function () {
        var users = JSON.parse(xhr.responseText);
        if (xhr.readyState == 4 && xhr.status == "200") {


            for (var i = 0; i => UserProfile.length; i++) {
                if (UserProfile[i]._id == select_Val) {
                    var result = UserProfile[i];
                    console.log(result);
                    //load_SelectedSession(result);
                    break;
                }
            }

        } else {}
    }
    xhr.send(null);


}

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
}