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

//loadHighlights called by contentScriptController
contentScript.view.loadHighlights = loadHighlights;

contentScript.controller.contentScriptController = contentScriptController;
contentScriptController();

contentScript.view.highlight = highlight;
highlight();
    
