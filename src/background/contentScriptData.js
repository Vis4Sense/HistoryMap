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
		//adds highlighted text or image
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
    
    updateType: function(typeUpdate) {
        //locates the original highlight(note), updates its text and/or type
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
    },

    //debug function
    displayState: function() {
        console.log(this.urlToHighlight);
    }
}
	

	