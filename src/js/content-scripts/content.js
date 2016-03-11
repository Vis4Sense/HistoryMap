$(function() {
    // Only run when the background page opened
    chrome.runtime.sendMessage({ type: "backgroundOpened" }, function(response) {
        if (response) {
            setTimeout(loadHighlights, 1000);
            completePendingTask();
            respondExtension();
            // focusWhenHovering();

            console.log("SensePath: content script loaded");
        }
    });
});

var intervalId; // for alerting tab

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
        } else if (request.type === 'alertTab') {
            var count = 11;

            intervalId = setInterval(function() {
                var favIconUrl = count % 2 ? chrome.extension.getURL("src/css/dummy-icon.png") : request.icon;
                var title = count % 2 ? '' : request.title;
                setIcon(favIconUrl, title);

                if (!count) clearInterval(intervalId);

                count--;
            }, 250);
        } else if (request.type === 'stopAlertTab') {
            clearInterval(intervalId);
            setIcon(request.icon, request.title);
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

function setIcon(favIconUrl, title) {
    var link = document.querySelector('link[rel=icon]') || document.querySelector("link[rel='shortcut icon']");

    if (link) {
        link.href = favIconUrl;
    } else {
        link = document.createElement('link');
        link.type = 'image/png';
        link.rel = 'shortcut icon';
        link.href = favIconUrl;
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    document.title = title || '.';
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