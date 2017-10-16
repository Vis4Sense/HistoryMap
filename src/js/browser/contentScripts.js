$(function() {
    // Only run after the background page opens.
    chrome.runtime.sendMessage({ type: "backgroundOpened" }, function(response) {
        if (!response) return;
            // If page uses ajax, we don't know when it's actually complete such as google search result page.
            // Naively wait one more second.
            setTimeout(function() {
                loadHighlights();
            }, 2000);


        // Want to know if a link is clicked. Used for detecting page linking relationship.
        injectLinks();
        completePendingTask();
        respondExtension();
        console.log("SensePath: content script loaded");
    });
});

function injectLinks() {
     // Can't use 'click' because it doesn't detect a click when right click and open in new tab.
  	$('body').on('mouseover', 'a', function() { // kai: is this jquery? what if mouseover and no click?
  	    chrome.runtime.sendMessage({ type: "linkClicked" });
    });
}

/**
 * Loads existing highlights to the page.
 */
function loadHighlights() {
    // Get data from the extension
    chrome.runtime.sendMessage({ type: "requestData" }, function(response) {
        if (!response) return;

        response.forEach(function(d) {
            if (d.type === "highlight") {
                $.highlightPath(d.path, d.classId);
            } else if (d.type === "note") {
                $.highlightPath(d.path, d.classId, d);
            }
        });
    });
}

/**
 * Captures page activities to be able to infer if the page is idle or not.
 */
function captureActivities() {
	window.addEventListener("focus", handle);
    window.addEventListener("blur", handle);
    window.addEventListener("keydown", handle);
    window.addEventListener("mousewheel", handle);
    window.addEventListener("mousedown", handle);
    window.addEventListener("mousemove", handle);
}

function handle() {
	 chrome.runtime.sendMessage({ type: this.event.type, time: +new Date() });
}

function respondExtension() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === "scrollToElement") {
            scrollTo(request);
        } else if (request.type === "removeHighlight") {
            // Remove highlight by replacing 'mark' node with 'text' node
        } else if (request.type === 'askReferrer') {
            sendResponse(document.referrer);
        } else if (request.type === 'highlightSelection') {
            highlightSelection(sendResponse);
        }
    });
}

function highlightSelection(sendResponse) {
	var selection = getSelection();
    if (!selection || selection.type !== "Range") return;
    sendResponse($.highlight(selection));
    selection.empty();
}

function scrollTo(request) {
    var node;
    try {
        if (request.path) {
            node = document.evaluate(request.path.split(/\|/g)[0], document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.parentNode;// node is a text node
        } else {
            var nodes = document.querySelectorAll("img");
            for (var i = 0; i < nodes.length; i++) { // Can't use querySelector because of relative image src
                if (nodes[i].src === request.image) {
                    node = nodes[i];
                    break;
                }
            }
        }
    } finally {
        if (node) {
            $('html, body').animate({
                scrollTop: Math.max(0, $(node).offset().top - 100)
            }, 500);
            setTimeout(function() {
                $(node).fadeTo("fast", 0.2);
                $(node).fadeTo("fast", 1);
            }, 500);
        }
    }
}

/**
 * Runs some tasks requested before content script finishes loading.
 */
function completePendingTask() {
    chrome.runtime.sendMessage({ type: "requestTask" }, function(response) {
        if (response) {
            scrollTo(response);
        }
    });
}