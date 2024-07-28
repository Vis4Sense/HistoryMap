/**
 * @fileoverview vertical indented tree, compacting minimised nodes
 */

function indentedTreeMinLayout({
    indent = 15,
    marginTop = 10,
    spacingY = 5,
    linkDx = 5,
}) {
    var module,
        nodes,
        links,
        nodeDict,
        linkDict,
        roots;

    var parent = d => nodes.find(n => n.pageId === d.parentPageId);

    function initialize() {
        
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

    function nodeLevel(node) {
        if (!node) return -1;
        return 1 + nodeLevel(parent(node));
    }

    initialize();

    return module = {
        run: function() {
            var sortedNodes = sortNodes();

            sortedNodes.forEach((node, i) => {
                node.x = indent * nodeLevel(node);
                // node.y = 
            })
        },
    };
}
