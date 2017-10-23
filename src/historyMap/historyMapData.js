historyMap.model.nodes = {
    
    nodes: [],
    
    getNode: function(index) {
        return this.nodes[index];
    },
    
    addNode: function(node) {
        return this.nodes.push(node);
    },
    
    updateNode: function(index,node) {
        return this.nodes[index] = node;
    },

    getArray: function() {
        return this.nodes;
    }
}

function Node(id, tabId, time, url, title, favIconUrl, parentTabId, from) {
    this.id = id;
    this.tabId = tabId;
    this.time = time;
    this.url = url;
    this.text = title;
    this.favIconUrl = favIconUrl;
    this.parentTabId = parentTabId;
    this.from = from;
}