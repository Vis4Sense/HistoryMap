document.addEventListener('DOMContentLoaded', function () {
	chrome.browserAction.onClicked.addListener(function() {
		const url = chrome.extension.getURL('src/html/history-map-page.html');

		// Only allow a single instance of the history map
		if (getView(url)) return;

		// Adjust location and size of the current window, where the extension button is clicked
		chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
			left: screen.width * 0.4, top: 0, width: screen.width * 0.6, height: screen.height
		});

		// Create an instance of the history map
		chrome.windows.create({
	    	url: url,
	    	type: 'popup',
	    	left: 0,
	    	top: 0,
	    	width: screen.width * 0.4,
	    	height: screen.height
	    }, function(w) {
	    	chrome.windows.update(w.id, { focused: true });
	    });

		// Listen to content script
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			if (request.type === 'backgroundOpened') { // To respond that the background page is currently active
				sendResponse(true);
			}
		});
	});

	/**
	 * Returns an extension page by url.
	 */
	function getView(url) {
		const views = chrome.extension.getViews();

		for (let i = 0; i < views.length; i++) {
			if (views[i].location.href === url) return views[i];
		}

		return null;
	}
});