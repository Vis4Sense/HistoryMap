document.addEventListener('DOMContentLoaded', function () {
	// Called when the browser action is clicked.
	chrome.browserAction.onClicked.addListener(function() {
		// Load views based on saved settings
		chrome.storage.sync.get(null, function(items) {
			openMainView(items.sensepathMode, items.showBrowser, items.showVideo, items.showText);
		});
	});

	function openMainView(sensePathMode, showBrowser, showVideo, showText) {
		// Get the main view or create if it doesn't exist
		var page = "src/pages/index.html";

		// Allow a single instance of SensePath
		if (getView(chrome.extension.getURL(page))) return;

		// Note: I'm trying to produce a neat layout based on which views are visible, but have to hardcode a lot.
		var dockHeight = 40, // Mac
			menuBarHeight = 29, // Mac
			titleBarHeight = 22, // When height is set to window, it sets the innerHeight rather than the outerHeight
			// smHeight = 210,
			smHeight = 0,
			smTop = screen.height - smHeight - dockHeight,
			browserHeight = smTop - menuBarHeight,
			fullHeight = browserHeight - titleBarHeight, // Height of other windows such as video or text
			halfHeight = Math.round(fullHeight / 2);

	    // Resize current window
		chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
			left: 0, top: 0, width: screen.width / 2, height: fullHeight
		});

		// Timeline: always show
		chrome.windows.create({
	    	url: chrome.extension.getURL(page), type: "popup", left: screen.width / 2, top: 0, width: screen.width / 2, height: fullHeight
	    });

		// Listen to content script
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			if (request.type === "backgroundOpened") { // To respond that background page already opened
				sendResponse(true);
			}
		});
	}

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