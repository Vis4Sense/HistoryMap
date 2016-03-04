/**
 * dag this provides layout for acyclic direct graph.
 */
sm.layout.dag = function() {
    var module = {};

    // Key function to bind data
    var key = d => d.id,
        linkKey = d => key(d.source) + "-" + key(d.target);

    var nodes, links,
        nodeDict, linkDict,
        dummyContainer, // needs for mxClient to run its layout
        graph, // mxClient graph
        parentNode,
        layout,
        intraCellSpacing = 10,
        interRankCellSpacing = 50,
        width, height,
        label = d => d.label;

    function init() {
        if (dummyContainer) return;

        dummyContainer = document.createElement('div');
        document.body.appendChild(dummyContainer);
    }

    function buildGraph() {
        graph = new mxGraph(dummyContainer);
        parentNode = graph.getDefaultParent();
        layout = new mxHierarchicalLayout(graph, "west");
        layout.intraCellSpacing = intraCellSpacing;
        layout.interRankCellSpacing = interRankCellSpacing;

        nodeDict = {}, linkDict = {};
        nodes.forEach(d => nodeDict[key(d)] = graph.insertVertex(parentNode, null, '', 0, 0, d.width, d.height));
        links.forEach(d => linkDict[linkKey(d)] = graph.insertEdge(parentNode, null, '', nodeDict[key(d.source)], nodeDict[key(d.target)]));
    }

    function inferRanks() {
        // Nodes in the same rank have the same centre's x value
        nodes.forEach(n => {
            n.rank = Math.round((n.x + n.width / 2) / 10);
        });

        var ranks = _.uniq(nodes.map(n => n.rank)).sort(d3.ascending);

        // Reassign rank to the sorted index so that it has value as 0, 1, 2...
        nodes.forEach(n => {
            n.rank = ranks.indexOf(n.rank);
        });
    }

    function fixHighestRank() {
        if (nodes.length < 3) return;

        // Infer node ranks from computed node positions
        // Just to ensure any round-off error which makes rankCenters not the same
        var highestRankScore = d3.max(nodes, n => Math.round((n.x + n.width / 2) / 10));
        var highestRankNodes = nodes.filter(n => Math.round((n.x + n.width / 2) / 10) === highestRankScore);
        var highestRankLinks = links.filter(l => highestRankNodes.find(n => n === l.target));

        // Fix groups of nodes having the same parent
        _.each(_.groupBy(highestRankLinks, l => key(l.source)), fixGroup);
    }

    function fixGroup(rankLinks) {
        // Only fix if these nodes only have one parent
        var rankNodes = rankLinks.map(l => l.target);

        // Assume nodes have similar height
        var h = d3.max(rankNodes, n => n.height) + intraCellSpacing;

        // Naive solution: stick with the highest value, then subtract others equally
        var sorted = rankNodes.sort((a, b) => d3.descending(a.y, b.y));
        sorted.forEach((n, i) => {
            n.y = sorted[0].y - i * h;
        });

        // Move connecting links as well
        rankLinks.forEach(l => {
            // Only the last two points; move them vertically
            l.points.slice(l.points.length - 2).forEach(p => {
                p.y = l.target.y + l.target.height / 2;
            });
        });
    }

    /**
     * Sets/gets nodes.
     */
    module.vertices = function(value) {
        if (!arguments.length) return nodes;
        nodes = value;
        return this;
    };

    /**
     * Sets/gets links. Assumes that each link has 'source' and 'target' attributes refering to their objects.
     */
    module.edges = function(value) {
        if (!arguments.length) return links;
        links = value;
        return this;
    };

    /**
     * Sets/gets spacing between cells in the same rank.
     */
    module.intraCellSpacing = function(value) {
        if (!arguments.length) return intraCellSpacing;
        intraCellSpacing = value;
        return this;
    };

    /**
     * Sets/gets spacing between ranks.
     */
    module.interRankCellSpacing = function(value) {
        if (!arguments.length) return interRankCellSpacing;
        interRankCellSpacing = value;
        return this;
    };

    /**
     * Computes the layout.
     */
    module.compute = function() {
        init();
        buildGraph();

        // Run layout
        d3.select(dummyContainer).classed('hide', false);
        layout.execute(parentNode);
        d3.select(dummyContainer).classed('hide', true);

        // Reassign computed position to data
        nodes.forEach(d => {
            var m = nodeDict[key(d)].geometry;
            d.x = m.x;
            d.y = m.y;
        });

        links.forEach(d => {
            d.points = linkDict[linkKey(d)].geometry.points.map(p => ({ x: p.x, y: p.y }));
            // There's a gap between the source to the first point, and a gap between the last point and the target.
            // Thus, need to add the source and the target points.
            var p0 = { x: d.source.x + (d.target.x > d.source.x ? d.source.width : 0), y: d.points[0].y };
            var p1 = { x: d.target.x + (d.target.x > d.source.x ? 0 : d.target.width ), y: d.points[d.points.length - 1].y };
            d.points.unshift(p0);
            d.points.push(p1);
        });

        // Infer rank of nodes based on computed position
        inferRanks();

        // Ugly case: sometimes, there's a gap among the highest rank nodes even though they're children and only children of the same parent
        fixHighestRank();

        // Computed graph size
        width = graph.view.graphBounds.width;
        height = graph.view.graphBounds.height;

        return { width: width, height: height };
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

    return module;
};