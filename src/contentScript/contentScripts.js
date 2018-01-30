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
		// Get data from the extension
		chrome.runtime.sendMessage({ type: "loadHighlights" }, function(response) {
			console.log("*** load highlight response is not understood by chrome");
			console.log(response);
			if (!response) return;
			response.forEach(function(d) {
				console.log(d);
				if (d.type === "highlightSelection") {
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
    
