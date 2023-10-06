const contentScript = function () {
    const contentScript = {
        view: {
        },
        controller: {
        }
    };
    return contentScript;
}();

loadHighlights  = function (url) {
		// Get data from the extension background.js
		chrome.runtime.sendMessage({ type: "loadHighlights" }, function(response) {
			if (!response) return;
			response.forEach(function(d) {
				if (d.type === "highlightSelection") {
					$.highlightPath(d.path, d.classId);
				} else if (d.type === "note") {
					$.highlightPath(d.path, d.classId, d);
				} else if (d.type === "highlightImage") {
					changeHighlightImage(d.srcUrl, d.pageUrl, true);
				}
			});
		});
}

//loadHighlights called by contentScriptController
contentScript.view.loadHighlights = loadHighlights;

contentScript.controller.contentScriptController = contentScriptController;
contentScriptController();

contentScript.view.highlight = highlight;
highlight();
    
