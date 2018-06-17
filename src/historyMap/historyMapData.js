function Node(id, tabId, time, url, title, favIconUrl, from, isTabOpen) {
    this.id = id;
    this.tabId = tabId;
    this.time = time;
    this.url = url;
    this.text = title;
    this.favIconUrl = favIconUrl;
    this.from = from;
    this.isTabOpen = isTabOpen; // whether the browser tab showing the node URL is open
}

historyMap.model.nodes = {

    nodeArray: [],

    getNode: function (index) {
        return this.nodeArray[index];
    },

    getNodeIndex: function (node) {
        return this.nodeArray.indexOf(node);
    },

    addNode: function (node) {
        var index = this.nodeArray.push(node);
        historyMap.view.redraw();
        return index;
    },

    updateNode: function (index, node) {
        var result = (this.nodeArray[index] = node);
        historyMap.view.redraw();
        return result;
    },

    getArray: function () {
        return this.nodeArray;
    },

    getSize: function () {
        return this.nodeArray.length;
    },

    empty: function () {
        this.nodeArray.length = 0;
        historyMap.view.redraw();
    },

    //locates the original highlight(note), marks it as hidden
    hideNode: function (tabUrl, classId) {
        var foundNode = this.nodeArray.find(a => (a.url === tabUrl) && (a.classId === classId));
        foundNode.hidden = true;
        return foundNode;
    },

    //locates the original highlight(note), updates its text and/or type    
    updateType: function (typeUpdate) {
        if (typeUpdate.type === 'note') {
            var foundNode = this.nodeArray.find(a => a.classId === typeUpdate.classId)
            foundNode.text = typeUpdate.text;
            foundNode.type = typeUpdate.type;
            return foundNode;
        }
    }
}

function Tab(tabId, node, isCompleted) {
    this.tabId = tabId;
    this.node = node; // the latest node for this tab
    this.isCompleted = isCompleted;
}

historyMap.model.tabs = {

    tabArray: [], // store the tabs that are currently open

    addTab: function(tab) {
        return this.tabArray.push(tab);
    },

    getArray: function() {
        return this.tabArray;
    },

    getTab: function(tabId) {
        return this.tabArray.find(item => item.tabId == tabId);
    },
	
	getId: function(tabId){
		return this.getTab(tabId).node.id;
	}
}

historyMap.model.sessions = {
    sessions: [],

    getSessions: function () {
        return this.sessions;
    }
};