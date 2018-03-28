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
		//adds highlighted text image or note
        this.prepareUrlForHighlights(url);
        var highlights = this.urlToHighlight[url];
        if (highlight.type === "highlightImage"){
            //removing an already highlighted image(if it exists)
            var foundNode = highlights.find(a => (a.type === "highlightImage") && (a.pageUrl === highlight.pageUrl));
            var foundNodeIndex = highlights.indexOf(foundNode);
            if(foundNodeIndex > -1){
                highlights.splice(foundNodeIndex, 1);
            }
        }
		//pushes "highlightImage", "highlightSelection"(text) and "noted"(note)
        highlights.push(highlight);
		return highlights;
    },
    
    removeHighlight: function(url, highlight) {
		//removes highlighted text(and note) or image
        this.prepareUrlForHighlights(url);
        if (highlight.type === "removeHighlightImage"){
            var highlights = this.urlToHighlight[url];
            var foundNode = highlights.find(a => (a.pageUrl === highlight.pageUrl) && (a.srcUrl === highlight.srcUrl));
            var foundNodeIndex = highlights.indexOf(foundNode);
            if(foundNodeIndex > -1){
                highlights.splice(foundNodeIndex, 1);
            }
        } else if (highlight.type === "highlightRemoved"){
            var highlights = this.urlToHighlight[url];
			//found node could be highlighted text or a note
            var foundNode = highlights.find(a => a.classId === highlight.classId);
            var foundNodeIndex = highlights.indexOf(foundNode);
            if(foundNodeIndex > -1){
                highlights.splice(foundNodeIndex, 1);
            }
        }
    },
    
    getHighlightTextPath: function(typeUpdate) {
        //locates the original highlighted text, returns its X-path
        if (typeUpdate.type === 'note') {
            var highlights = this.urlToHighlight[typeUpdate.url];
            var foundNode = highlights.find(a => a.classId === typeUpdate.classId)
            return foundNode.path;
        }
    },

    prepareUrlForHighlights: function (url) {
        //if url array does not exist, create one
        if(!this.urlToHighlight[url]){
            this.urlToHighlight[url] = [];
        }
    },

    //debug function
    displayState: function() {
        console.log(this.urlToHighlight);
    }
}
	

	