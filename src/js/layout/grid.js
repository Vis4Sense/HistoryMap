/**
 * grid provides a simple grid layout for a directed acyclic graph.
 * It's used together with another layout on the same data object, so it can't use standard {x, y} attributes.
 * It assigns v.rp.x and v.rp.y for vertices, and e.rpoints for edges.
 */
sm.layout.grid = function() {
    var module = {};

    var vertices, edges, // data input
        newVertices, newEdges,
        width, height, // constrained size
        graphWidth = 0, graphHeight = 0, // the actual size that the graph has
        children = d => d.links,
        parent = d => d.sup,
        label = d => d.label,
        tipLength = 16,
        layout = sm.layout.forest();

    function layoutNewNodes() {
        newVertices = vertices.filter(v => v.newlyCurated);
        newEdges = edges.filter(e => e.source.newlyCurated || e.target.newlyCurated);

        // Use a dag layout for new nodes on cloned objects so that assigned attributes won't overwrite existing ones.
        newVertices.forEach(v => {
            v.clone = { id: v.id, width: v.rp.width, height: v.rp.height, links: [] };
        });

        // Setup children/parent for cloned vertices based on original ones
        newVertices.forEach(v => {
            if (children(v)) {
                children(v).forEach(c => {
                    v.clone.links.push(c.clone);
                });
            }
            if (parent(v)) {
                v.clone.sup = parent(v).clone;
            }
        });

        var clonedVertices = newVertices.map(v => v.clone);
        var clonedEdges = newEdges.filter(e => e.source.newlyCurated && e.target.newlyCurated).map(e => ({ source: e.source.clone, target: e.target.clone }));

        layout.label(label).vertices(clonedVertices).edges(clonedEdges).compute();

        // Reassign computed location to expected attributes.
        // Need to shift new nodes to avoid overlapping with existing ones.
        graphWidth = d3.max(vertices, v => v.rp.x + v.rp.width) || 0;
        graphHeight = d3.max(vertices, v => v.rp.y + v.rp.height) || 0;

        newVertices.forEach(v => {
            v.rp.x = v.clone.x;
            v.rp.y = v.clone.y + graphHeight + (graphHeight ? 20 : 0);
        });

        // Compute points for all edges without having rpoints so that it can apply for graph with preloaded data
        edges.filter(e => !e.rpoints).forEach(e => {
            var centerSource = { x: e.source.rp.x + e.source.rp.width / 2, y: e.source.rp.y + e.source.rp.height / 2 },
                centerTarget = { x: e.target.rp.x + e.target.rp.width / 2, y: e.target.rp.y + e.target.rp.height / 2 };
            e.rpoints = [ sm.getRectEdgePoint(e.source.rp, centerTarget), sm.getRectEdgePoint(e.target.rp, centerSource) ];
        });
    }

    /**
     * Computes the layout.
     */
    module.compute = function() {
        layoutNewNodes();

        // Done layout for new nodes, next time, do not touch
        newVertices.forEach(v => { v.newlyCurated = false; });

        graphWidth = d3.max(vertices, v => v.rp.x + v.rp.width) || 0;
        graphHeight = d3.max(vertices, v => v.rp.y + v.rp.height) || 0;

        return { width: graphWidth, height: graphHeight };
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
     * Sets/gets the children accessor.
     */
    module.children = function(value) {
        if (!arguments.length) return children;
        children = value;
        return this;
    };

    return module;
};