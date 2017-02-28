$(function() {
    // Only run after the background page opens.
    chrome.runtime.sendMessage({ type: "backgroundOpened" }, function(response) {
        if (!response) return;

        // Want to know if a link is clicked. Used for detecting page linking relationship.
        injectLinks();
    });
});

function injectLinks() {
     // Can't use 'click' because it doesn't detect a click when right click and open in new tab.
  	$('body').on('mouseover', 'a', function() { // kai: is this jquery? what if mouseover and no click?
  	    chrome.runtime.sendMessage({ type: "linkClicked" });
    });
}