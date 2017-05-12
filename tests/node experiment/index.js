onload = function() {
    var mdEl = document.getElementById("markdown");
    var htmlEl = document.getElementById("html");

    var md = require("markdown").markdown;

    mdEL.onkeypress = function(){
    var output = markdown.md.toHTML(mdEl.value);
    htmlEl.innerHTML = output;
    }

};