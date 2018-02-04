const contentScript = {
	model : {
		nodes: {}, // the annotation nodes (text, picture and note highlighting)
		urlToHighlight: {} //to synchronise highlights across tabs (with same url)
	}
}

function updateModel(request){
    var highlightToAdd;
    var tabUrl = request.tabUrl;
    if (request.innerType == "highlightSelection"){
        highlightToAdd = {type: request.innerType, path:request.path, text: request.text, classId: request.classId};
        contentScript.model.urlToHighlight.addHighlight(tabUrl, highlightToAdd);
    } else if (request.innerType == "highlightImage"){
        highlightToAdd = {type: request.innerType, srcUrl: request.srcUrl, pageUrl: request.pageUrl};
        contentScript.model.urlToHighlight.addHighlight(tabUrl, highlightToAdd);
    } else if (request.innerType == "removeHighlightImage"){
        var highlightToRemove = {type: request.innerType, srcUrl: request.srcUrl, pageUrl: request.pageUrl}; 
        contentScript.model.urlToHighlight.removeHighlight(tabUrl, highlightToRemove);
    } else if (request.innerType == "noted"){
        contentScript.model.urlToHighlight.updateType(request.data);
	}  else if (request.innerType == "highlightRemoved"){
		var highlightToRemove = {type:request.innerType, classId: request.classId}; 
		contentScript.model.urlToHighlight.removeHighlight(tabUrl, highlightToRemove);
	}
	contentScript.model.urlToHighlight.displayState();
}

document.addEventListener('DOMContentLoaded', function () {
	chrome.browserAction.onClicked.addListener(function () {

		// change the extension icon to the coloured one, which should be used when SenseMap is active

		chrome.browserAction.setIcon({
			path: "/logo/sm-logo-19.png"
		});
		const url = chrome.extension.getURL('src/historyMap/historyMap.html');
		// Only allow a single instance of the history map
		if (getView(url)){
			return;
		} 
		
		// Adjust location and size of the current window, where the extension button is clicked
		chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
			// left: Math.floor(screen.width * 0.33), top: 0, width: Math.floor(screen.width * 0.67), height: screen.height
			left: 0,
			top: 0,
			width: Math.floor(screen.width / 2),
			height: Math.floor(screen.height * 0.7)
		});

		// Create an instance of the history map
		// if (ProfileName = localStorage.getItem('ProfileName') !== null) {
			chrome.windows.create({
				url: url,
				type: 'popup',
				// left: 0,
				// top: 0,
				// width: Math.floor(screen.width * 0.33),
				// height: screen.height
				left: 0,
				top: Math.floor(screen.height * 0.7 + 25),
				width: Math.floor(screen.width / 2),
				height: Math.floor(screen.height * 0.3 - 25)
			}, function (w) {
				chrome.windows.update(w.id, {
					focused: true
				});
			});
		// }
		// else {
		// 	google_Login();
		// }

		// Listen to content script
		chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
			 console.log("background got a message " + JSON.stringify(request));    
			if (request.type === 'backgroundOpened') { // To respond that the background page is currently active
				sendResponse({backgroundOpened: true, url: sender.tab.url});
			} else if (request.type === "noted") {
				const typeUpdate = {
					classId: request.data.classId,
					text: request.data.text,
					type: 'note',
					url: sender.tab.url
				};
				var modelInfo = {type: 'updateModel', innerType:'noted', tabUrl: sender.tab.url, data: typeUpdate};
				updateModel(modelInfo);
			} else if (request.type === "highlightRemoved"){
				//received remove highlight from contentScript view (highlight.js)
				var modelInfo = {type: 'updateModel', innerType:request.type, classId: request.classId, tabUrl: sender.tab.url};
				updateModel(modelInfo);
			} else if (request.type === "loadHighlights"){
				var highlightsToLoad = contentScript.model.urlToHighlight.getHighlights(sender.tab.url);
				sendResponse(highlightsToLoad);
			}
			//potentially used to make reponse asynchronous https://codereview.chromium.org/1874133002/diff/80001/chrome/common/extensions/docs/templates/articles/messaging.html
			//return true;
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