document.addEventListener('DOMContentLoaded', function () {
	createContextMenus();
	var urlToHighlight = contentScript.model.urlToHighlight;
	chrome.browserAction.onClicked.addListener(function() {
		const url = chrome.extension.getURL('src/historyMap/historyMap.html');

		// Only allow a single instance of the history map
		if (getView(url)) return;

		// Adjust location and size of the current window, where the extension button is clicked
		chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
			// left: Math.floor(screen.width * 0.33), top: 0, width: Math.floor(screen.width * 0.67), height: screen.height
			left: 0, top: 0, width: Math.floor(screen.width/2), height: Math.floor(screen.height*0.7)
		});

		// Create an instance of the history map
		chrome.windows.create({
	    	url: url,
	    	type: 'popup',
	    	// left: 0,
	    	// top: 0,
	    	// width: Math.floor(screen.width * 0.33),
	    	// height: screen.height
	    	left: 0,
	    	top: Math.floor(screen.height * 0.7 + 25),
	    	width: Math.floor(screen.width/2),
	    	height: Math.floor(screen.height * 0.3 - 25)
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

	function createContextMenus() {
        chrome.contextMenus.removeAll();

        // To highlight selected text
        chrome.contextMenus.create({
            id: 'sm-highlight',
            title: 'Highlight',
            contexts: ['selection']
        });

        // To save image
        chrome.contextMenus.create({
            id: 'sm-save-image',
            title: 'Set as Page Image',
            contexts: ['image']
		});
		
        //function on contextMenuClicked
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'sm-highlight') {
				chrome.tabs.sendMessage(tab.id, { type: 'highlightSelection' }, response => {
					if (response) {
						if (!urlToHighlight[tab.url]) {
							urlToHighlight[tab.url] = []; 
						}
						//urlToHighlight[tab.url].push({type: 'highlight', path: d.path, text: d.text, classId: d.classId});
						urlToHighlight.addHighlight(url, {type: 'highlight', path: d.path, text: d.text, classId: d.classId});
					}
                });
            } else if (info.menuItemId === 'sm-save-image') {
				// Overwrite existing image
				chrome.tabs.sendMessage(tab.id, {type: 'highlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl}, response => {
					if (response) {
					}
					if (!urlToHighlight[tab.url]) {
						urlToHighlight[tab.url] = []; 
					}
					 //urlToHighlight[tab.url].push({type: 'highlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl});
					 urlToHighlight.addHighlight(url, {type: 'highlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl})
                });

				//To remove image (created once an image is saved)
				chrome.contextMenus.create({
					id: 'sm-remove-image',
					title: 'Remove Page Image',
					contexts: ['image']
        		});
			} else if (info.menuItemId === 'sm-remove-image') {
				chrome.tabs.sendMessage(tab.id, {type: 'removeHighlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl}, response => {
					if (response) {
					}
				});
			}
        });
    }

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