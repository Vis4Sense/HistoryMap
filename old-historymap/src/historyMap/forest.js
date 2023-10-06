/**
 * forest provides a layout for a set of tree-like data.
 */
historyMap.view.layout.forest = function() {
    var module = {};

    // Key function to bind data
    var key = d => d.id,
        linkKey = d => key(d.source) + "-" + key(d.target);

    var vertices, edges,
        roots,
        width, height,
        children = d => d.links,
        parent = d => d.source,
        time = d => d.time,
        label = d => d.label,
        nodeDict, linkDict,
        dummyContainer, // needs for mxClient to run its layout
        graph, // mxClient graph
        parentNode,
        layout,
        headLength = 16;

    /**
     * Invoke the given function (accepts a single parameter) in depth-first search order.
     */
    function dfs(d, f) {
        f(d);
        if (children(d)) children(d).forEach(c => {
            dfs(c, f);
        });
    }

    /**
     * Invoke the given function in depth-first search order considering all roots.
     */
    function dfsRoots(f) {
        roots.forEach(r => {
            dfs(r, f);
        });
    }

    /**
     * Earlier vertices are shown first.
     */
    function order() {
        var timeSort = (a, b) => d3.ascending(time(a), time(b));
        roots = vertices.filter(n => !parent(n)).sort(timeSort);
        dfsRoots(d => {
            if (children(d)) children(d).sort();
        });
    }

    function init() {
        if (dummyContainer) return;

        dummyContainer = document.createElement('div');
        document.body.appendChild(dummyContainer);
    }

    function buildGraph() {
        graph = new mxGraph(dummyContainer);
        parentNode = graph.getDefaultParent();
        layout = new mxCompactTreeLayout(graph, true);
        layout.useBoundingBox = false;
        layout.edgeRouting = false;
        layout.levelDistance = 30;
        layout.nodeDistance = 5;

        nodeDict = {};
        linkDict = {};
        vertices.forEach(d => {
            nodeDict[key(d)] = graph.insertVertex(parentNode, null, '', 0, 0, d.width, d.height);
        });
        edges.forEach(d => {
            linkDict[linkKey(d)] = graph.insertEdge(parentNode, null, '', nodeDict[key(d.source)], nodeDict[key(d.target)]);
        });

        // Virtual edges to roots
        var root = graph.insertVertex(parentNode, null, '', 0, 0, -layout.levelDistance - 10, -layout.levelDistance - 10);
        roots.forEach(r => {
            graph.insertEdge(parentNode, null, '', root, nodeDict[key(r)]);
        });
    }

    function runMXLayout() {
        d3.select(dummyContainer).classed('hide', false);
        layout.execute(parentNode);
        d3.select(dummyContainer).classed('hide', true);
    }

    function setNodeCoordinate() {
        vertices.forEach(d => {
            var m = nodeDict[key(d)].geometry;
            d.x = m.x;
            d.y = m.y;
        });
    }

    function setLinkCoordinate() {
        // Make the 'link' object accessible from its source
        vertices.forEach(n => {
            n._edges = [];
        });
        edges.forEach(l => {
            l.source._edges.push(l);
        });

        vertices.forEach(n => {
            if (!n._edges.length) return;

            // For each node, we want to distribute the contacting points of outgoing edges along the boundary rather than always in the center
            var scale = d3.scale.ordinal()
                .domain(_.range(children(n).length))
                .rangePoints([ 0, n.height ], 1);

            // Make the tips in the middle longer to give bigger angles [0, 1, 2, 2, 1, 0]
            var l = children(n).length,
                deltas = _.range(l),
                m = Math.floor((l - 1) / 2);
            for (var i = m + 1; i < l; i++) {
                deltas[i] = l - i - 1;
            }

            n._edges.forEach((l, i) => {
                var p1 = { x: l.source.x + l.source.width, y: l.source.y + scale(i) },
                    p2 = { x: p1.x + headLength / 2 + deltas[i] * 2, y: p1.y },
                    p4 = { x: l.target.x, y: l.target.y + l.target.height / 2 },
                    p3 = { x: p4.x - headLength, y: p4.y };
                l.points = [ p1, p2, p3, p4 ];
            });
        });

        vertices.forEach(n => {
            delete n._edges;
        });

        // edges.forEach(e => {
        //     var centerSource = { x: e.source.x + e.source.width / 2, y: e.source.y + e.source.height / 2 },
        //         centerTarget = { x: e.target.x + e.target.width / 2, y: e.target.y + e.target.height / 2 };
        //     e.points = [ historyMap.getRectEdgePoint(e.source, centerTarget), historyMap.getRectEdgePoint(e.target, centerSource) ];
        // });
    }

    /**
     * Computes the layout.
     */
    module.compute = function() {
        order();
        init();
        buildGraph();
        runMXLayout();
        setNodeCoordinate();
        setLinkCoordinate();

        // The vis width and height
        return {
            width: d3.max(vertices, n => n.x + n.width) || 0,
            height: d3.max(vertices, n => n.y + n.height) || 0
        };
    };

    /**
     * Sets/gets data input: a list vertices.
     */
    module.vertices = function(value) {
        if (!arguments.length) return vertices;
        vertices = value;
        return this;
    };

    /**
     * Sets/gets data input: a list edges.
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
     * Sets/gets the childrent accessor.
     */
    module.children = function(value) {
        if (!arguments.length) return children;
        children = value;
        return this;
    };

    /**
     * Sets/gets the parent accessor.
     */
    module.parent = function(value) {
        if (!arguments.length) return parent;
        parent = value;
        return this;
    };

    /**
     * Sets/gets the time accessor.
     */
    module.time = function(value) {
        if (!arguments.length) return time;
        time = value;
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

    return module;
};