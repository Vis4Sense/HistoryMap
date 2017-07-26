$(() => {
    // Only run when the background page opened
    chrome.runtime.sendMessage({type: 'backgroundOpened'}, response => {
        if (response) {
            // If page uses ajax, we don't know when it's actually complete such as google search result page.
            // Naively wait one more second.
            setTimeout(() => {
                loadHighlights();
            }, 2000);

            injectLinks();
            captureActivities();
            completePendingTask();
            respondExtension();
            // focusWhenHovering();

            console.log('SenseMap: content script loaded');
        }
    });
});

/**
 * Sometimes as in google search result page, the href is different from the opening page! Redirect?
 */
function injectLinks() {
    $(document).on('click', 'a', () => {
        chrome.runtime.sendMessage({type: 'linkClicked'});
    });
}

/**
 * Loads existing highlights to the page in the browser.
 */
function loadHighlights() {
    // Get data from the extension
    chrome.runtime.sendMessage({type: 'requestData'}, response => {
        if (!response) {
            return;
        }

        response.forEach(d => {
            if (d.type === 'highlight') {
                $.highlightPath(d.path, d.classId);
            } else if (d.type === 'note') {
                $.highlightPath(d.path, d.classId, d);
            }
        });
    });
}

/**
 * Captures page activities to be able to infer if the page is idle or not.
 */
function captureActivities() {
    ['focus', 'blur', 'keydown', 'mousewheel', 'mousedown', 'mousemove'].forEach(event => {
        window.addEventListener(event, () => {
            chrome.runtime.sendMessage({type: this.event.type, time: Date.now()});
        });
    });
}

function respondExtension() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'scrollToElement') {
            scrollTo(request);
        } else if (request.type === 'removeHighlight') {
            // Remove highlight by replacing 'mark' node with 'text' node
            $('.' + request.classId).each(function() {
                // 'Remove' appended to the end of the node because button is added into markNode. Get only text node.
                var texts = $(this).contents().filter(function() { return this.nodeType === 3; });
                if (texts.length) {
                    this.parentNode.insertBefore(document.createTextNode(texts[0].textContent), this);
                    this.parentNode.removeChild(this);
                }

                // One of them can be the note icon
                if ($(this).hasClass('sm-note-icon')) {
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
    if (!selection || selection.type !== 'Range') {
        return;
    }
    sendResponse($.highlight(selection));
    selection.empty();
}

function scrollTo(request) {
    var node;
    try {
        if (request.path) {
            node = document.evaluate(
                request.path.split(/\|/g)[0], document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
            ).singleNodeValue.parentNode;// node is a text node
        } else {
            var nodes = document.querySelectorAll('img');
            // Can't use querySelector because of relative image src
            for (var i = 0; i < nodes.length; i++) {
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
            setTimeout(() => {
                $(node).fadeTo('fast', 0.2);
                $(node).fadeTo('fast', 1);
            }, 500);
        }
    }
}

/**
 * Runs some tasks requested before content script finishes loading.
 */
function completePendingTask() {
    chrome.runtime.sendMessage({type: 'requestTask'}, response => {
        if (response) {
            scrollTo(response);
        }
    });
}

function focusWhenHovering() {
    $('body').mouseover(() => {
        chrome.runtime.sendMessage({type: 'focusWindow'});
    });
}
