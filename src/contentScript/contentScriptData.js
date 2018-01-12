contentScript.model.urlToHighlight = {
    //this will store all the highlight/annotation nodes
    urlToHighlight: [],

	getArray: function () {
		return this.urlToHighlight;
	},
	
	getHighlights: function (url) {
        //ensures that at the very least an empty array is returned
        this.prepareUrlForHighlights(url);
		return this.urlToHighlight[url];
	},
	
	addHighlight: function (url, highlight) {
        this.prepareUrlForHighlights(url);
        this.urlToHighlight[url].push(highlight);
		return this.urlToHighlight[url];
    },
    
    removeHighlight: function(url, highlight) {
        this.prepareUrlForHighlights(url);
    },
    
    updateHighlight: function() {
        //find original highlight node, modify the type and update its text 
    },

    prepareUrlForHighlights: function (url) {
        //if url array does not exist, create one
        if(!this.urlToHighlight[url]){
            this.urlToHighlight[url] = [];
        }
    }
}
	

	