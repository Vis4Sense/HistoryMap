// Saved hmPages
var savedHmPages = [];

// Button element
const sessionButtonLoad = document.getElementById("session-button-load");

// Listen clicking button
sessionButtonLoad.addEventListener("click", () => {
    console.log("loading session");
    loadSession();
})

// Load session from local storage
function loadSession() {
    // File input
    const fileInput = document.getElementById("session-file-input");

    // Check if file selected
    if (fileInput.files.length == 0) {
        console.log("no file selected");
        window.alert("No file selected");
        return;
    }

    // Read file
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        const jsonData = JSON.parse(content);
        console.log("sucessfully loaded session data");
        console.log(jsonData);

        // Yuhan: check if the data is valid?

        savedHmPages = jsonData;
        playSession();
    }
    reader.readAsText(file);
}

// Play the loaded session
function playSession(duration=1000) {
    // Starting from empty hmPages
    const curHmPages = [];

    // Debug div id
    const debugDivId = "svg-debug";

    // Progressively add pages
    savedHmPages.forEach((page, idx) => {
        setTimeout(() => {
            curHmPages.push(page);
            displayTree3(curHmPages, debugDivId)
        }, duration * idx);
    });
}
