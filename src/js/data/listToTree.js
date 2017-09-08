/**
 * listToTree converts action data from array format to tree format.
 * Input: Each action is a change of data such as adding/removing a node/link.
 * Output: Combine all changes to produce the final hierarchical structure.
 */
sm.data.listToTree = function() {
    // The hierarchy output
    let root;

    function module(actions) {
        root = {};

        // These fields will be used in constructing the hierarchy and need to be reset.
        actions.forEach(n => {
            delete n.children;
            delete n.parent;
            delete n.links;
            delete n.source;
        });

        // Build parent-child relationship
        actions.slice(1).forEach(d => {
            // Add page linking as a type of link
            // 16.06.2017, Phong: chrome may not detect as a link
            // if (d.type === 'link') {
                const source = actions.find(d2 => d2.id === d.from);
                if (source && source !== d && !d.hidden) {
                    addLink(source, d);
                    // if (d.url) {
                    //     if (source.url) {
                    //         addLink(source, d);
                    //     } else {
                    //         addLink(source.source, d);
                    //     }
                    // } else {
                    //     // If a node doesn't have url, it is a temporary one, may be the result of redirection.
                    //     // This node will be excluded from the display
                    //     // but the 'source' will be updated to always refer to the normal node
                    //     d.source = source.source || source; // either recursive (in case multiple empty nodes) or the latest
                    // }
                }
            // }

            // If the action type of an item is embedded, add it as a child of the containing page
            if (d.embedded && !d.hidden) {
                const source = actions.find(d2 => d2.id === d.from);
                if (source && source !== d) {
					addChild(source, d);
                }
            }
        });

        // Add nodes, excluding child actions and empty url nodes
        // root.nodes = actions.filter(a => !a.parent && a.url);

        // Add nodes, excluding child actions
        root.nodes = actions.filter(a => !a.parent && !a.hidden);
		
        // Then add to the link list
        root.links = [];
        root.nodes.filter(d => d.links).forEach(d => {
            d.links.forEach(c => {
                if (root.nodes.includes(c)) root.links.push({ source: d, target: c });
            });
        });

        return root;
    }

    function addLink(p, c) {
        if (!p.links) p.links = [];
        p.links.push(c);
        c.source = p;
    };

    function addChild(p, c) {
        if (!p.children) p.children = [];
        p.children.push(c);
        c.parent = p;
    };

    return module;
};