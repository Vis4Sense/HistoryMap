$(function() {
    // Only run when the background page opened
    chrome.runtime.sendMessage({ type: "backgroundOpened" }, function(response) {
        if (response) {
            // If page uses ajax, we don't know when it's actually complete such as google search result page.
            // Naively wait one more second.
            setTimeout(function() {
                injectLinks();
                loadHighlights();
            }, 2000);

            completePendingTask();
            respondExtension();
            // focusWhenHovering();

            console.log("SensePath: content script loaded");
        }
    });
});

/**
 * Sometimes as in google search result page, the href is different from the openning page! Redirect?
 */
function injectLinks() {
    $('body a').mouseover(function(e) {
        // Google search result uses 'href'.
        // this.href returns full urls
        var values = [ this.href, this.getAttribute('data-href') ].filter(v => v);
        chrome.runtime.sendMessage({ type: "linkClicked", values: values });
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

function respondExtension() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === "scrollToElement") {
            scrollTo(request);
        } else if (request.type === "removeHighlight") {
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

function focusWhenHovering() {
    $('body').mouseover(function() {
        chrome.runtime.sendMessage({ type: "focusWindow" });
    });
}