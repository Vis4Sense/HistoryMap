/**
 * @fileoverview vertical tree layout using mxGraph
 */

function indentedTreeLayout({
    indent = 10,
    spacingY = 5,
    linkDx = 5,
} = {}) {
    var module,
        nodes,
        links,
        roots,
        nodeDict,
        linkDict,
        dummyContainer,
        graph,
        parentNode,
        layout;

    // key functions to bind data
    var nodeKey = d => d.pageId,
        linkKey = d => d.source.id + "-" + d.target.id;
    
    var key2node = d => nodes.find(n => n.pageId === d);

    // function to find parent node
    var parent = d => nodes.find(n => n.pageId === d.parentPageId);

    function initialize() {
        dummyContainer = utils.dummyContainer();

        graph = new mxGraph(dummyContainer.get());
        parentNode = graph.getDefaultParent();

        layout = new mxStackLayout(graph, false);
        layout.spacing = spacingY;

        nodeDict = {};
        linkDict = {};

        initializeNodes();
    }

    function nodeLevel(node) {
        if (!node) return -1;
        return 1 + nodeLevel(parent(node));
    }

    function sortNodes() {
        var sortedNodes = [];

        function dfs(node) {
            sortedNodes.push(node);
            nodes.filter(n => n.parentPageId === node.pageId).forEach(dfs);
        }

        roots.forEach(dfs);
        return sortedNodes;
    }

    function initializeNodes() {
        if (!nodes) return;

        roots = nodes.filter(d => !parent(d));

        links = nodes.filter(d => parent(d))
            .map(d => ({
                source: { id: nodeKey(parent(d)) },
                target: { id: nodeKey(d) }
            }));
        
        var sortedNodes = sortNodes();
        sortedNodes.forEach(d => {
            nodeDict[nodeKey(d)] = graph.insertVertex(parentNode, null, '', 0, 0, d.width, d.height);
        });

        links.forEach(d => {
            linkDict[linkKey(d)] = graph.insertEdge(parentNode, null, '', nodeDict[d.source.id], nodeDict[d.target.id]);
        });

        // virtual root and edges
        const virtualRoot = graph.insertVertex(parentNode, null, '', 0, 0, -10, -10);
        roots.forEach(r => {
            graph.insertEdge(parentNode, null, '', virtualRoot, nodeDict[nodeKey(r)]);
        });
    }

    // indent
    function nodeX(nodeId) {
        var geometry = nodeDict[nodeId].geometry;
        var node = key2node(nodeId);
        return geometry.x + indent * nodeLevel(node);
    }

    function setNodeCoordinate() {
        nodes.forEach(d => {
            var m = nodeDict[nodeKey(d)].geometry;
            d.x = nodeX(nodeKey(d));
            d.y = m.y;
        });
    }

    function setLinkCoordinate() {
        links.forEach(l => {
            var source = nodeDict[l.source.id].geometry;
            var target = nodeDict[l.target.id].geometry;
            l.source.x = nodeX(l.source.id) + linkDx;
            l.source.y = source.y + source.height;
            l.target.x = nodeX(l.target.id);
            l.target.y = target.y + target.height / 2;
        })
    }

    initialize();

    return module = {
        run: function() {
            layout.execute(parentNode);
            setNodeCoordinate();
            setLinkCoordinate();
            return module;
        },

        close: function() {
            dummyContainer.remove();
            return module;
        },

        nodes: function(_) {
            return arguments.length ? (nodes = _, initializeNodes(), module) : nodes;
        },

        links: function() {
            return links;
        },

        width: function() {
            return d3.max(nodes, d => d.x + d.width) || 0;
        },

        height: function() {
            return d3.max(nodes, d => d.y + d.height) || 0;
        }
    }
}
