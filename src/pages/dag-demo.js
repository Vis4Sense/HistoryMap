$(function() {
    var dataPath = "data/latest.json",
        embeddedTypes = [ "highlight", "note", "filter" ],
        data = {};

    // Instantiate vis
    var dag = sm.vis.senseforest()
        .label(d => d.text)
        .icon(d => d.favIconUrl);

    // Update the vis
    var updateVis = function() {
        // Update size of the vis and the container
        var width = $(".sm-dag-demo").width();
        var height = $(".sm-dag-demo").height();
        dag.width(width).height(height);

        redraw();
    };

    // Run first time to build the vis
    d3.json(dataPath, function(data) {
        buildHierarchy(data);
        updateVis();
    });

    // Rebuild vis when the window is resized
    var id;
    $(window).resize(function() {
        clearTimeout(id);
        id = setTimeout(updateVis, 100);
    });

    function redraw() {
        d3.select(".sm-dag-demo").datum(data).call(dag);
    }

    function addLink(p, c) {
        if (!p.links) p.links = [];
        p.links.push(c);
        c.sup = p;
    };

    function addChild(p, c) {
        if (!p.children) p.children = [];
        p.children.push(c);
        c.parent = p;
    };

    // Convert flat list of nodes to parent-children network, then redraw the vis.
    function buildHierarchy(allNodes, noRedraw) {
        // Init
        allNodes.forEach(n => {
            delete n.children;
            delete n.parent;
            delete n.links;
            delete n.sup;
        });

        // - Build parent-child relationship first
        allNodes.forEach(function(d, i) {
            if (!i) return;

            // Add page linking as a type of link
            if (d.type === 'link') {
                var source = allNodes.find(d2 => d2.id === d.from);
                if (source) {
                    addLink(source, d);
                } else {
                    console.log('could not find the source of ' + d.text);
                }
            }

            // If the action type of an item is embedded, add it as a child of the containing page
            if (embeddedTypes.includes(d.type)) {
                var source = allNodes.find(d2 => d2.id === d.from);
                if (source) {
                    addChild(source, d);
                } else {
                    console.log('could not find the source of ' + d.text);
                }
            }
        });

        // - Ignore child nodes
        data.nodes = allNodes.filter(n => !n.parent);

        // Specific for test data: add two semantic links
        if (name === 'p1') {
            var tv = data.nodes.find(n => n.text.startsWith('trivago.es'));
            var ri = data.nodes.find(n => n.text.startsWith('the river inn hotel'));
            var gh = data.nodes.find(n => n.text.startsWith('Grand Hyatt Washington washington dc'));

            if (tv && ri) addLink(tv, ri);
            if (tv && gh) addLink(tv, gh);
        }

        // - Then add to the link list
        data.links = [];
        data.nodes.forEach(function(d) {
            if (d.links) {
                d.links.forEach(function(c) {
                    if (data.nodes.includes(c)) data.links.push({ source: d, target: c });
                });
            }
        });
    }
});