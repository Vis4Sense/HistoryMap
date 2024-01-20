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

        if (request.type === 'highlightSelection') {
            highlightSelection(sendResponse);
        } else if (request.type === 'highlightImage') {
            changeHighlightImage(request.srcUrl, request.pageUrl, true, sendResponse);
        }
        
        // else if (request.type === 'highlightImage') {
        //     changeHighlightImage(request.srcUrl, request.pageUrl, true, sendResponse);
        // } else if (request.type === 'removeHighlightImage') {
        //     changeHighlightImage(request.srcUrl, request.pageUrl, false, sendResponse);
        // }

        // This is used to indicate that sendResponse will be called asynchronously
        return true;
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

// Define a function to get base64 from the image source URL along with width and height
async function getImageBase64(url) {
    try {
      // Use fetch to get the image Response object
      const response = await fetch(url);
  
      // Convert the Response object to ArrayBuffer
      const buffer = await response.arrayBuffer();
  
      // Convert ArrayBuffer to base64
      const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  
      // Create an Image object
      const img = new Image();
  
      // Set Image object's src attribute to the base64 data
      img.src = `data:${response.headers.get('content-type')};base64,${base64}`;
  
      // Wait for the image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });
  
      // Get the image width and height
      const width = img.width;
      const height = img.height;
  
      // Return an object with base64, width, and height
      return {
        base64: img.src,
        width,
        height,
      };
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
}  

function changeHighlightImage(srcUrl, pageUrl, applyHighlight, sendResponse) {
    // sendresponse only exists when this function originates from contextMenu,
    // the other call originates from loadHighlights (with no sendResponse)
    var imageSrcAttribute = calculateImgSrcAttribute(srcUrl, pageUrl);
    var imageElement = locateImageElement(imageSrcAttribute);
    if (imageElement) {
        if (applyHighlight) {
            // Yuhan: we will allow saving multiple images, so we don't need to remove the highlight from other images
            // removeHighlightFromImages();

            imageElement.addClass("sm-highlight-image");
            // console.log("highlighted image, class added");

            // send the base64 of the highlighted image to the background script
            if(sendResponse){
                getImageBase64(srcUrl).then(({base64, width, height}) => {
                    if (base64) {
                        sendResponse({imageHighlighted: true, imageBase64: base64, imageWidth: width, imageHeight: height });
                    }
                })
            }
        } else {
            imageElement.removeClass("sm-highlight-image");
            if(sendResponse){
                sendResponse({ imageHighlighted: false });
            }
        }
    }
}
