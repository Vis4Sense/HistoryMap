/**
 * mod does some data processing stuff for provenance capture.
 */
sm.provenance.mod = function() {
    var module = {},
        data = chrome.extension.getBackgroundPage().data,
        view = 'name';

    var dispatch = d3.dispatch('redrawn', 'actionAdded', 'nodeClicked');

    /**
     * Each action is a change of data. Merge all changes to produce the latest data.
     */
    module.mergeActions = function(actions) {
        // Init
        actions.forEach(n => {
            delete n.children;
            delete n.parent;
            delete n.links;
            delete n.sup;
        });

        // - Build parent-child relationship first
        actions.forEach((d, i) => {
            if (!i) return;

            // Add page linking as a type of link
            if (d.type === 'link' || isSearchType(d.type)) {
                var source = actions.find(d2 => d2.id === d.from);
                if (source && source !== d) {
                    addLink(source, d);
                } else {
                    // console.log('could not find the source of ' + d.text);
                }
            }

            // If the action type of an item is embedded, add it as a child of the containing page
            if (isEmbeddedType(d.type)) {
                var source = actions.find(d2 => d2.id === d.from);
                if (source) {
                    addChild(source, d);
                } else {
                    // console.log('could not find the source of ' + d.text);
                }
            }
        });

        // - Ignore child and link actions
        data.nodes = actions.filter(a => !a.parent && isPageType(a.type));

        // - Clear 'state' attributes so that history will be replayed
        data.nodes.forEach(n => {
            delete n.userImage;
            delete n.collectionRemoved;
            delete n.curationRemoved;
            delete n.favorite;
            delete n.minimized;
            delete n.curated;
            delete n.rp;
        });

        // - Node attribute
        actions.filter(a => !isPageType(a.type)).forEach(a => {
            var n = getNodeById(a.id);
            if (!n) return;

            if (a.type === 'save-image') n.userImage = a.value;
            if (a.type === 'remove-collection-node') n.collectionRemoved = true;
            if (a.type === 'remove-curation-node') n.curationRemoved = true;
            if (a.type === 'favorite-node') n.favorite = true;
            if (a.type === 'unfavorite-node') n.favorite = false;
            if (a.type === 'minimize-node') n.minimized = true;
            if (a.type === 'restore-node') n.minimized = false;
            if (a.type === 'curate-node') {
                n.curated = true;
                n.curationRemoved = false;
                n.rp = a.trp;
            }
            if (a.type === 'move-node') n.rp = a.trp;
        });

        // - Then add to the link list
        data.links = [];
        // -- Automatic links
        data.nodes.filter(d => d.links).forEach(d => {
            d.links.forEach(c => {
                if (data.nodes.includes(c)) data.links.push({ source: d, target: c });
            });
        });

        // -- User links
        actions.filter(a => !isPageType(a.type)).forEach(a => {
            var l = getLinkByIds(a.sourceId, a.targetId);
            if (a.type === 'add-link') {
                if (l) {
                    l.removed = false;
                } else {
                    data.links.push({ source: getNodeById(a.sourceId), target: getNodeById(a.targetId), userAdded: true });
                }
            }
            if (a.type === 'remove-link' && l) l.removed = true;
        });
    };

    function isPageType(type) {
        return [ 'search', 'location', 'dir', 'highlight', 'note', 'filter', 'link', 'type', 'bookmark' ].includes(type);
    }

    function isEmbeddedType(type) {
        return [ 'highlight', 'note', 'filter' ].includes(type);
    }

    function isSearchType(type) {
        return [ 'search', 'location', 'dir' ].includes(type);
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

    function getNodeById(id) {
        return data.nodes.find(a => a.id === id);
    }

    function getLinkByIds(sourceId, targetId) {
        return data.links.find(l => l.source.id === sourceId && l.target.id === targetId);
    }

    /**
     * Handle events fired by the given vis.
     */
    module.handleEvents = function(vis) {
        vis.on('nodeClicked', d => onNodeHandled('click-node', d))
           .on('nodeCollectionRemoved', d => onNodeHandled('remove-collection-node', d))
           .on('nodeCurationRemoved', d => onNodeHandled('remove-curation-node', d))
           .on('nodeFavorite', d => onNodeHandled('favorite-node', d))
           .on('nodeUnfavorite', d => onNodeHandled('unfavorite-node', d))
           .on('nodeMinimized', d => onNodeHandled('minimize-node', d))
           .on('nodeRestored', d => onNodeHandled('restore-node', d))
           .on('nodeHovered', (d, status) => onNodeHovered(d, status))
           .on('nodeMoved', d => onNodeHandled('move-node', d))
           .on('linkAdded', d => onLinkHandled('add-link', d))
           .on('linkRemoved', d => onLinkHandled('remove-link', d));
    };

    var redrawTypes = [ 'remove-curation-node', 'remove-collection-node-node' ];

    function onNodeHandled(type, d) {
        var a = {
            type: type,
            id: d.id,
            time: +new Date()
        };

        if (type === 'move-node') a.trp = d.rp;

        dispatch.actionAdded(a);

        if (redrawTypes.includes(type)) dispatch.redrawn();

        if (type === 'click-node') dispatch.nodeClicked(d);
    }

    function onNodeHovered(d, status) {
        chrome.runtime.sendMessage({ type: 'nodeHovered', value: d.id, view: view, status: status });
    }

    function onLinkHandled(type, d) {
        dispatch.actionAdded({
            type: type,
            sourceId: d.source.id,
            targetId: d.target.id,
            time: +new Date()
        });
    }

    /**
     * Just get real fields, not the generated one to prevent circular json.
     */
    module.getCoreData = function(d) {
        // Don't need to save 'state' properties because they have their corresponding actions,
        // which generate those properties such as favorite, minimized
        // 'value' is to store the state property in the action.
        // 'trp': we don't want to save 'rp', which is a state property
        var c = {},
            fields = [ 'id', 'text', 'url', 'type', 'time', 'endTime', 'favIconUrl', 'image', 'classId', 'path', 'from',
                'seen', 'value', 'sourceId', 'targetId', 'trp' ];

        fields.forEach(f => {
            if (d[f] !== undefined) c[f] = d[f];
        });

        return c;
    };

    /**
     * Sets/gets the view name.
     */
    module.view = function(value) {
        if (!arguments.length) return view;
        view = value;
        return this;
    };

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};