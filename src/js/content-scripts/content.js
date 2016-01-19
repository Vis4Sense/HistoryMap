$(function() {
    // Only run when the background page opened
    chrome.runtime.sendMessage({ type: "backgroundOpened" }, function(response) {
        if (response) {
            augmentSelections();
            loadHighlights();
            respondSubItemClicked();
            completePendingTask();
            respondHighlightRemoved();

            console.log("SensePath: content script loaded");
        }
    });
});

/**
 * Adds highlight/take notes for selection.
 */
function augmentSelections() {
    // Always highlight without displaying option
    $("body").mouseup(function(e) {
        var activeElement = document.activeElement;
        var tagName = activeElement.tagName.toLowerCase();
        if (tagName === "textarea") return;
        if (tagName === "input" && activeElement.getAttribute("type") === "text") return;

        var selection = getSelection();
        if (!selection || selection.type !== "Range") return;

        var classId = "sm-" + (+new Date());
        var h = $.highlight(selection, classId);
        h.classId = classId;
        selection.empty();

        // Tell the extension
        chrome.runtime.sendMessage({ type: "highlighted", data: h });
        chrome.runtime.sendMessage({ type: "clipboardCopied", data: h.text });
    });
}

/**
 * Loads existing highlights to the page.
 */
function loadHighlights() {
    // Get data from the extension
    chrome.runtime.sendMessage({ type: "dataRequested" }, function(response) {
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
 * Will scroll to the sub-item.
 */
function respondSubItemClicked() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === "scrollToElement") {
            scrollTo(request);
        }
    });
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
    chrome.runtime.sendMessage({ type: "taskRequested" }, function(response) {
        if (response) {
            scrollTo(response);
        }
    });
}

function respondHighlightRemoved() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === "removeHighlight") {
            // Remove highlight by replacing 'mark' node with 'text' node
            $("." + request.classId).each(function() {
                // 'Remove' appended to the end of the node because button is added into markNode. Get only text node.
                var texts = $(this).contents().filter(function() { return this.nodeType === 3; });
                if (texts.length) {
                    this.parentNode.insertBefore(document.createTextNode(texts[0].textContent), this);
                    this.parentNode.removeChild(this);
                }

                // One of them can be the note icon
                if ($(this).hasClass("sm-note-icon")) {
                    $(this).remove();
                }
            });
        }
    });
}