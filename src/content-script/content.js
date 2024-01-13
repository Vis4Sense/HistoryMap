console.log("history map content.js loading");

// Copy from old-historymap/src/contentScript/contentScripts.js

const contentScript = function () {
    const contentScript = {
        view: {
        },
        controller: {
        }
    };
    return contentScript;
}();

contentScript.controller.contentScriptController = contentScriptController;
contentScriptController();

contentScript.view.highlight = highlight;
highlight();
