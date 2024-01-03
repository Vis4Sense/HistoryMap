// Button element
const sessionButtonSave = document.getElementById("session-button-save");

// Listen clicking button
sessionButtonSave.addEventListener("click", () => {
    console.log("saving session");
    saveSession();
});

// Save session
function saveSession() {
    // Convert hmPages to JSON data
    const jsonData = JSON.stringify(hmPages, null, 2);

    // Create Blob object to save json data
    const blob = new Blob([jsonData], { type: "application/json" });

    // Create url
    const url = window.URL.createObjectURL(blob);

    // Create <a> element
    const link = document.createElement("a");
    link.href = url;
    link.download = "historymap-session.json";
    link.click();

    // Clean up the URL object to release resources
    window.URL.revokeObjectURL(url);
}
