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
        data.nodes = actions.filter(a => !a.parent && !isNonActionType(a.type));

        // - Node attribute
        actions.filter(a => isNonActionType(a.type)).forEach(a => {
            var n = getNodeById(a.id);
            if (!n) return;

            if (a.type === 'remove-collection-node') n.collectionRemoved = true;
            if (a.type === 'remove-curation-node') n.curationRemoved = true;
            if (a.type === 'favorite-node') n.favorite = true;
            if (a.type === 'unfavorite-node') n.favorite = false;
            if (a.type === 'minimize-node') n.minimized = true;
            if (a.type === 'restore-node') n.minimized = false;
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
        actions.filter(a => isNonActionType(a.type)).forEach(a => {
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

    function isNonActionType(type) {
        return [ 'click-node', 'revisit', 'remove-node', 'favorite-node', 'unfavorite-node',
            'minimize-node', 'restore-node', 'move-node', 'add-link', 'remove-link', 'relink', 'renode', 'hide-link' ].includes(type);
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
           .on('linkAdded', d => onLinkHandled('add-link', d))
           .on('linkRemoved', d => onLinkHandled('remove-link', d));
    };

    var redrawTypes = [ 'remove-curation-node' ];

    function onNodeHandled(type, d) {
        dispatch.actionAdded({
            type: type,
            id: d.id,
            time: +new Date()
        });

        if (redrawTypes.includes(type)) dispatch.redrawn();

        if (type === 'click-node') dispatch.nodeClicked(d);
    }

    function onNodeHovered(d, status) {
        chrome.runtime.sendMessage({ type: 'nodeHovered', value: d.id, view: view, status: status });
    }

    function onNodeMoved(d) {
        dispatch.actionAdded({
            type: 'move-node',
            id: d.id,
            time: +new Date(),
            x: d.x,
            y: d.y
        });
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
        var c = {},
            fields = [ 'id', 'text', 'url', 'type', 'time', 'endTime', 'favIconUrl', 'image', 'classId', 'path', 'from',
                'seen', 'favorite', 'minimized', 'collectionRemoved', 'curationRemoved', 'sourceId', 'targetId',
                'curated', 'newlyCurated', 'rp', 'rpoints' ];

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