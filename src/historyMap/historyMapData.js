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