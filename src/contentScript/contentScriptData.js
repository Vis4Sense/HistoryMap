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
    
    updateType: function(typeUpdate) {
        //locates the original highlight, updates its text and type
        if (typeUpdate.type === 'note') {
            var highlights = this.urlToHighlight[typeUpdate.url];
            var foundNode = highlights.find(a => a.classId === typeUpdate.classId)
            foundNode.text = typeUpdate.text;
            foundNode.type = typeUpdate.type;
            return foundNode;
        } else {
            nodes[typeUpdate.id].type = typeUpdate.type;
        }
    },

    prepareUrlForHighlights: function (url) {
        //if url array does not exist, create one
        if(!this.urlToHighlight[url]){
            this.urlToHighlight[url] = [];
        }
    }
}
	

	