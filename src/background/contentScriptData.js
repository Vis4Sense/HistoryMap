contentScript.model.urlToHighlight = {
    //this will store all the highlight/annotation nodes
    urlToHighlight: [],

	getArray: function () {
		return this.urlToHighlight;
	},
	
    //ensures that at the very least an empty array is returned
	getHighlights: function (url) {
        this.prepareUrlForHighlights(url);
		return this.urlToHighlight[url];
    },
    
	//adds highlighted text image or note
	addHighlight: function (url, highlight) {
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
		//pushes "highlightImage", "highlightSelection"(text) or "noted"(note)
        highlights.push(highlight);
		return highlights;
    },
    
    //removes highlighted text(and note) or image
    removeHighlight: function(url, highlight) {
        this.prepareUrlForHighlights(url);
        if (highlight.type === "removeHighlightImage"){
            var highlights = this.urlToHighlight[url];
            var foundNode = highlights.find(a => (a.pageUrl === highlight.pageUrl) && (a.srcUrl === highlight.srcUrl));
            var foundNodeIndex = highlights.indexOf(foundNode);
            if(foundNodeIndex > -1){
                highlights.splice(foundNodeIndex, 1);
            }
		//removes highlighted text or a note
        } else if (highlight.type === "highlightRemoved"){
            var highlights = this.urlToHighlight[url];
            var foundNode = highlights.find(a => a.classId === highlight.classId);
            var foundNodeIndex = highlights.indexOf(foundNode);
            if(foundNodeIndex > -1){
                highlights.splice(foundNodeIndex, 1);
            }
        }
    },
    
    //locates the original highlighted text, returns its X-path
    getHighlightTextPath: function(typeUpdate) {
        if (typeUpdate.type === 'note') {
            var highlights = this.urlToHighlight[typeUpdate.url];
            var foundNode = highlights.find(a => a.classId === typeUpdate.classId)
            return foundNode.path;
        }
    },
    
    //if url array does not exist, create one
    prepareUrlForHighlights: function (url) {
        if(!this.urlToHighlight[url]){
            this.urlToHighlight[url] = [];
        }
    },

    //debug function
    displayState: function() {
        console.log(this.urlToHighlight);
    }
}
	

	