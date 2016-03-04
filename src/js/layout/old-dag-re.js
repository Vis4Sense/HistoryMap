/**
 * dag provides a hierarchical layout for an directed acyclic graph.
 */
sm.layout.dag = function() {
    var module = {};

    var vertices, edges, // data input
        width, height, // constrained size
        direction = 'lr', // tb, bt, lr, rl
        vertexSep = 15, // space between two sibling vertices
        layerSep = 40; // space between two consecutive layers

    /**
     * Computes the layout.
     */
    module.compute = function() {
        // Create a new directed graph
        var g = new dagre.graphlib.Graph();

        // Set an object for the graph label
        g.setGraph({ rankdir: direction, ranksep: layerSep, nodesep: vertexSep });

        // Default to assigning a new object as a label for each new edge.
        g.setDefaultEdgeLabel(function() { return {}; });

        // Add nodes to the graph. The first argument is the node id. The second is
        // metadata about the node. In this case we're going to add labels to each of
        // our nodes.
        vertices.forEach(v => { g.setNode(v.id, v); });
        edges.forEach(e => { g.setEdge(e.source.id, e.target.id); });

        dagre.layout(g);

        // The layout gives the center, so convert to top-left
        vertices.forEach(v => {
            v.x -= v.width / 2;
            v.y -= v.height / 2;
        });

        edges.forEach(e => {
            e.points = g.edge({ v: e.source.id, w: e.target.id }).points;
        });

        return g;
    };

    /**
     * Sets/gets vertices.
     */
    module.vertices = function(value) {
        if (!arguments.length) return vertices;
        vertices = value;
        return this;
    };

    /**
     * Sets/gets edges. Assumes that each edge has 'source' and 'target' attributes refering to their objects.
     */
    module.edges = function(value) {
        if (!arguments.length) return edges;
        edges = value;
        return this;
    };

    /**
     * Sets/gets the constrained width of the layout.
     */
    module.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return this;
    };

    /**
     * Sets/gets the constrained height of the layout.
     */
    module.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return this;
    };

    /**
     * Sets/gets the label accessor.
     */
    module.label = function(value) {
        if (!arguments.length) return label;
        label = value;
        return this;
    };



    /**
     * Sets/gets spacing between cells in the same layer.
     */
    module.intraCellSpacing = function(value) {
        if (!arguments.length) return intraCellSpacing;
        intraCellSpacing = value;
        return this;
    };

    /**
     * Sets/gets spacing between layers.
     */
    module.interlayerCellSpacing = function(value) {
        if (!arguments.length) return interlayerCellSpacing;
        interlayerCellSpacing = value;
        return this;
    };

    return module;
};