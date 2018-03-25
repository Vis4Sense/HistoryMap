knowledgeMap.model.nodes = {

    nodes: [],

    getNode: function (index) {
        return this.nodes[index];
    },

    getNodeIndex: function (node) {
        return this.nodes.indexOf(node);
    },

    addNode: function (node) {
        var index = this.nodes.push(node);
        knowledgeMap.view.redraw();
        return index;
    },

    updateNode: function (index, node) {
        var result = (this.nodes[index] = node);
        knowledgeMap.view.redraw();
        return result;
    },

    getArray: function () {
        return this.nodes;
    },

    getSize: function () {
        return this.nodes.length;
    },

    empty: function () {
        this.nodes.length = 0;
        knowledgeMap.view.redraw();
    },

    hideNode: function(tabUrl, classId) {
        //locates the original highlight(note), marks it as hidden
        var foundNode = this.nodes.find(a => (a.url === tabUrl) && (a.classId === classId));
        foundNode.hidden = true;
        return foundNode;
    },

    updateType: function(typeUpdate) {
        //locates the original highlight(note), updates its text and/or type
        if (typeUpdate.type === 'note') {
            var foundNode = this.nodes.find(a => a.classId === typeUpdate.classId)
            foundNode.text = typeUpdate.text;
            foundNode.type = typeUpdate.type;
            return foundNode;
        }
    },
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
};