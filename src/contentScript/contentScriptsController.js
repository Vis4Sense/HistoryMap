contentScriptController = function () {
    // Only run after the background page opens. 
    chrome.runtime.sendMessage({ type: "backgroundOpened" }, function (response) {
        /*if (!response){
         return;}*/

        // If page uses ajax, we don't know when it's actually complete such as google search result page.
        // Naively wait one more second.
        setTimeout(function () {
            loadHighlights();
        }, 2000);


        // Want to know if a link is clicked. Used for detecting page linking relationship.
        injectLinks();
        completePendingTask();
        respondExtension();
        console.log("SensePath: content script controller loaded");
    });
};

function injectLinks() {
    // Can't use 'click' because it doesn't detect a click when right click and open in new tab.
    $('body').on('mouseover', 'a', function () { // kai: is this jquery? what if mouseover and no click?
        chrome.runtime.sendMessage({ type: "linkClicked" });
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
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		console.log("controller got a message " + JSON.stringify(request));
        if (request.type === "scrollToElement") {
            scrollTo(request);
        } else if (request.type === 'askReferrer') {
            sendResponse(document.referrer);
        } else if (request.type === 'highlightSelection') {
            highlightSelection(sendResponse);
        } else if (request.type === 'highlightImage') {
            changeHighlightImage(request.srcUrl, request.pageUrl, true, sendResponse);
        } else if (request.type === 'removeHighlightImage') {
            changeHighlightImage(request.srcUrl, request.pageUrl, false, sendResponse);
        } else if (request.type === "updateModel"){
            updateModel(request);
        }
    });
}

function highlightSelection(sendResponse) {
    var highlightReponse;
    var selection = getSelection();
    if (!selection || selection.type !== "Range") return;
    highlightResponse = $.highlight(selection);
    sendResponse(highlightResponse);
    selection.empty();
}

function calculateImgSrcAttribute(srcUrl, pageUrl) {
    //srcUrl and pageUrl are the same up to a certain point, 
    //the img(to highlight) elements' src attribute is a substring of srcUrl
    //this is found where srcUrl and pageUrl differ from each other
    //srcUrl = "https://myunihub-1.mdx.ac.uk/cas-web/images/mdx/mdx-icon-enrol.png"  
    //pageUrl = "https://myunihub-1.mdx.ac.uk/cas-web/login?service=https%3A%2F%2Fmyunihub.mdx.ac.uk%2Fc%2Fportal%2Flogin"
    //imgSrcAttribute = "images/mdx/mdx-icon-enrol.png"
    var imgSrcAttribute;
    for (var i = 0; i < srcUrl.length; i++) {
        var different = (srcUrl.charAt(i) != pageUrl.charAt(i));
        if (different) {
            imgSrcAttribute = srcUrl.substring(i);
            i = srcUrl.length + 1;
        }
    }
    return imgSrcAttribute;
}

function locateImageElement(srcAttributeValue) {
    var foundElements = $('img[src*="' + srcAttributeValue + '"');
    if (foundElements.length) {
        return foundElements;
    }
    return null;
}

function changeHighlightImage(srcUrl, pageUrl, applyHighlight, sendResponse) {
    var imageSrcAttribute = calculateImgSrcAttribute(srcUrl, pageUrl);
    var imageElement = locateImageElement(imageSrcAttribute);
    if (imageElement) {
        if (applyHighlight) {
            removeHighlightFromImages();
            imageElement.addClass("sm-highlight-image");
            sendResponse({ imageHighlighted: true });
        } else {
            imageElement.removeClass("sm-highlight-image");
            sendResponse({ imageHighlighted: false });
        }
    }
}

function removeHighlightFromImages() {
    var highlighedImageElements = $('.sm-highlight-image');
    if (highlighedImageElements) {
        highlighedImageElements.removeClass("sm-highlight-image");
    }
}

function scrollTo(request) {
    var node;
    try {
        if (request.path) {
            node = document.evaluate(request.path.split(/\|/g)[0], document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.parentNode;// node is a text node
        } else {
            var nodes = document.querySelectorAll("img");
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
            setTimeout(function () {
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
    chrome.runtime.sendMessage({ type: "requestTask" }, function (response) {
        if (response) {
            scrollTo(response);
        }
    });
}

function updateModel(response){
    console.log("updating model: add this to the model ");  
    console.log("the reponse to add is ... "+ JSON.stringify(response));
/*
//old method of adding for the different context menu interactions
if (!urlToHighlight[tab.url]) {
    urlToHighlight[tab.url] = []; 
}
urlToHighlight.addHighlight(url, {type: 'highlight', path: d.path, text: d.text, classId: d.classId});
urlToHighlight.addHighlight(url, {type: 'highlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl})
urlToHighlight.addHighlight(url, {type: 'note', classId: request.data.classId, text: request.data.text, url: sender.tab.url, path: request.data.path});
*/		
}