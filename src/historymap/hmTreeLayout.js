/**
 * @fileoverview Layout tree nodes using mxGraph
 */

function compactTreeLayout({
    levelDistance = 30,
    nodeDistance = 5,
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

    // function to find parent node
    var parent = d => nodes.find(n => n.pageId === d.parentPageId);

    function initialize() {
        dummyContainer = utils.dummyContainer();
        // dummyContainer = document.createElement('div');
        // document.body.appendChild(dummyContainer);

        graph = new mxGraph(dummyContainer.get());
        parentNode = graph.getDefaultParent();
        layout = new mxCompactTreeLayout(graph, true);

        layout.useBoundingBox = false;
        layout.edgeRouting = false;
        layout.levelDistance = levelDistance;
        layout.nodeDistance = nodeDistance;

        nodeDict = {};
        linkDict = {};

        initializeNodes();
    }

    function initializeNodes() {
        if (!nodes) return;

        roots = nodes.filter(d => !parent(d));

        links = nodes.filter(d => parent(d))
            .map(d => ({
                source: { id: nodeKey(parent(d)) },
                target: { id: nodeKey(d) }
            }));

        nodes.forEach(d => {
            nodeDict[nodeKey(d)] = graph.insertVertex(parentNode, null, '', 0, 0, d.width, d.height);
        });

        links.forEach(d => {
            linkDict[linkKey(d)] = graph.insertEdge(parentNode, null, '', nodeDict[d.source.id], nodeDict[d.target.id]);
        });

        // virtual root and edges
        const virtualRoot = graph.insertVertex(parentNode, null, '', 0, 0, -layout.levelDistance - 10, -layout.levelDistance - 10);
        roots.forEach(r => {
            graph.insertEdge(parentNode, null, '', virtualRoot, nodeDict[nodeKey(r)]);
        });
    }

    function setNodeCoordinate() {
        nodes.forEach(d => {
            var m = nodeDict[nodeKey(d)].geometry;
            d.x = m.x;
            d.y = m.y;
        });
    }

    function setLinkCoordinate() {
        links.forEach(l => {
            var source = nodeDict[l.source.id].geometry;
            var target = nodeDict[l.target.id].geometry;
            l.source.x = source.x + source.width;
            l.source.y = source.y + source.height / 2;
            l.target.x = target.x;
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
