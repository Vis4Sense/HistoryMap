document.addEventListener('DOMContentLoaded', function () {
	// Called when the browser action is clicked.
	chrome.browserAction.onClicked.addListener(function() {
		// Get the main view or create if it doesn't exist
		var url = chrome.extension.getURL("src/pages/index.html");

		// Allow a single instance
		if (getView(url)) return;

		// Shared by all views
		window.debugging = true;

	    // Resize current window
		chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
			left: 0, top: 0, width: screen.width / 2, height: screen.height
		});

		// Collection view
		chrome.windows.create({
	    	url: url,
	    	type: "popup",
	    	left: screen.width / 2,
	    	top: 0,
	    	width: screen.width / 2,
	    	height: screen.height - (window.debugging ? 600 : 0)
	    }, function(w) {
	    	chrome.windows.update(w.id, { focused: true });
	    });

		// Listen to content script
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			if (request.type === "backgroundOpened") { // To respond that background page already opened
				sendResponse(true);
			}
		});
	});

	function getView(url) {
		var views = chrome.extension.getViews();
		for (var i = 0; i < views.length; i++) {
			var view = views[i];
			if (view.location.href === url) {
				return view;
			}
		}

		return null;
	}
});