contentScript.model.urlToHighlight = {
    //this will store all the highlight/annotation nodes
    urlToHighlight: ["fake model"],

	getArray: function () {
		return this.urlToHighlight;
	},
	
	getHighlights: function (url) {
		return this.urlToHighlight[url];
	},
	
	addHighlight: function (url, highlight) {
		return this.urlToHighlight[url].push(highlight);
	},
	
    checkIfUrlContainsHighlights: function (url) {
        var highlightObject = urlToHighlight[url];
        if (typeof highlightObject !== "undefined") {
            return highlightObject;
        } else {
            return null;
        }
    }
}
	

	