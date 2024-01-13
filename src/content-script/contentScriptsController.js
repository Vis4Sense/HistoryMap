/**
 * @file contentScriptsController.js
 * @description Controller for content scripts
 * Reference: old-historymap/src/contentScript/contentScriptsController.js
 */

contentScriptController = function () {
    // Only run after the background page opens. 
    chrome.runtime.sendMessage({ type: "backgroundOpened" }, function (response) {
        if (!response) return;

        // If page uses ajax, we don't know when it's actually complete such as google search result page.
        // Naively wait one more second.
        // setTimeout(function () {
        //     loadHighlights(response.url);
        // }, 2000);


        // // Want to know if a link is clicked. Used for detecting page linking relationship.
        // injectLinks();
        // completePendingTask();
        respondExtension();
    });
};

function respondExtension() {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        //console.log("controller got a message " + JSON.stringify(request));    
		// if (request.type === "scrollToElement") {
        //     scrollTo(request);
        // } else if (request.type === 'askReferrer') {
        //     sendResponse(document.referrer);
        // } else 

        // response to highlightSelection
        if (request.type === 'highlightSelection') {
            highlightSelection(sendResponse);
        }

        // else if (request.type === 'highlightImage') {
        //     changeHighlightImage(request.srcUrl, request.pageUrl, true, sendResponse);
        // } else if (request.type === 'removeHighlightImage') {
        //     changeHighlightImage(request.srcUrl, request.pageUrl, false, sendResponse);
        // }
    });
}

function highlightSelection(sendResponse) {
    var highlightResponse;
    var selection = getSelection();
    if (!selection || selection.type !== "Range") return;
    highlightResponse = $.highlight(selection);
    sendResponse(highlightResponse);
    selection.empty();
}
