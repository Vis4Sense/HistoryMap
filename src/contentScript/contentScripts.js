const contentScript = function () {
    const contentScript = {
        model: {
            nodes: {}, // the annotation nodes (text, picture and note highlighting)
            urlToHighlight: {} //to synchronise highlights across tabs (with same url)
        },
        view: {
        },
        controller: {
        }
    };
    return contentScript;
}();

loadHighlights  = function () {
		// Get data from the extension
		chrome.runtime.sendMessage({ type: "loadHighlights" }, function(response) {
			if (!response) return;
			
			response.forEach(function(d) {
				if (d.type === "highlight") {
					$.highlightPath(d.path, d.classId);
				} else if (d.type === "note") {
					$.highlightPath(d.path, d.classId, d);
				} else if (d.type === "highlightImage") {
					changeHighlightImage(d.srcUrl, d.pageUrl, true);
				}
			});
		});
		console.log("loadHighlights listener has been registered");
}

contentScript.view.loadHighlights = loadHighlights;
//loadHighlights called by contentScriptController

contentScript.controller.contentScriptController = contentScriptController;
contentScriptController();

contentScript.view.highlight = highlight;
highlight();
console.log("Content script highlight and controller have been logged " + new Date().getTime());
console.log("before adding event listeners"+ new Date().getTime());

		alert("before adding event listeners " + new Date().getTime());
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log("got a runtime message " + JSON.stringify(request));
			if (request.type === 'getModel') { // To respond that the background page is currently active
				console.log("getmodel received");
				sendResponse({data: "hello"});
			}
			
			if (request.type === 'contentScriptDefine'){
				console.log("got contentScriptDefine message");
			}
});
console.log("after adding event listeners");
    
