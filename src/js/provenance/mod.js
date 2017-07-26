/**
 * mod does some data processing stuff for provenance capture.
 */
sm.provenance.mod = function() {
    var module = {},
        backgroundPage = chrome.extension.getBackgroundPage(),
        data = backgroundPage.data,
        view = 'name';

    var dispatch = d3.dispatch('redrawn', 'actionAdded', 'nodeClicked');

    /**
     * Each action is a change of data. Merge all changes to produce the latest data.
     *
     * @param {Array} actions
     * @param {Array} nodes
     */
    module.mergeActions = function(actions, nodes) {
        // - Ignore child and link actions
        if (nodes) {
            data.nodes = nodes.slice();
        } else {
            data.nodes = actions.filter(a => !a.parent && typeof a.isRegistered == 'function' && a.isRegistered());
        }

        // - Clear 'state' attributes so that history will be replayed
        data.nodes.forEach(n => {
            /**
             * The line below was commented out because it didn't allow to create a node on Knowledge Map
             * when using the button 'Curate' at the first time
             */
            // delete n.curated;
            delete n.rp;
        });
        // - Node attribute
        actions.filter(a => typeof a.isRegistered === 'undefined').forEach(a => {
            var n = getNodeById(a.id);
            if (!n) {
                return;
            }

            switch (a.type) {
                case 'save-image':
                    n.userImage = a.value;
                    break;
                case 'remove-collection-node':
                    n.collectionRemoved = true;
                    break;
                case 'remove-curation-node':
                    n.curationRemoved = true;
                    break;
                case 'unfavorite-node':
                case 'favorite-node':
                    n.favorite = a.type === 'favorite-node';
                    break;
                case 'restore-node':
                case 'minimize-node':
                    n.minimized = a.type === 'minimize-node';
                    break;
                case 'curate-node':
                    n.curationRemoved = false;
                case 'move-node':
                    n.rp = a.trp;
                    break;
                default:
                    break;
            }
        });
        // - Then add to the link list
        data.links = [];
        // -- Automatic links
        data.nodes.filter(d => d.slaves).forEach(d => {
            d.slaves.forEach(c => {
                if (data.nodes.includes(c)) {
                    data.links.push({source: d, target: c});
                }
            });
        });
        // -- User links
        let events = actions.filter(a => !(a instanceof SenseNode));
        events.forEach(events => {
            var link = getLinkByIds(events.sourceId, events.targetId);
            switch (events.type) {
                case 'add-link':
                    if (link) {
                        link.removed = false;
                    } else {
                        data.links.push({
                            source: getNodeById(events.sourceId),
                            target: getNodeById(events.targetId),
                            userAdded: true
                        });
                    }
                    break;
                case 'remove-link':
                    if (link) {
                        link.removed = true;
                    }
                    break;
                default:
                    break;
            }
        });
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
            .on('nodeCollectionMoved', d => onNodeHandled('move-collection-node', d))
            .on('nodeCurationMoved', d => onNodeHandled('move-curation-node', d))
            .on('linkAdded', d => onLinkHandled('add-link', d))
            .on('linkRemoved', d => onLinkHandled('remove-link', d));
    };

    function onNodeHandled(type, d) {
        var a = {
            type: type,
            id: d.id,
            time: Date.now()
        };

        switch (type) {
            case 'move-collection-node':
                a.trp = d.rp;
                break;
            case 'move-curation-node':
                chrome.runtime.sendMessage({type: 'nodeCurationMoved', value: d.export});
                break;
            case 'click-node':
                dispatch.nodeClicked(d);
                break;
            case 'remove-curation-node':
            case 'remove-collection-node':
                dispatch.redrawn();
                break;
            default:
                console.warn('Unknown type: ' + type);
                break;
        }
        dispatch.actionAdded(a);

    }

    function onNodeHovered(d, status) {
        chrome.runtime.sendMessage({type: 'nodeHovered', value: d.id, view: view, status: status});
    }

    function onLinkHandled(type, d) {
        if (backgroundPage.options.debugOthers) {
            console.log('onLinkHandled: node ', [d.source, d.target], ', type ' + type);
        }
        dispatch.actionAdded({
            type: type,
            sourceId: d.source.id,
            targetId: d.target.id,
            time: Date.now()
        });
    }

    /**
     * Sets/gets the view name.
     */
    module.view = function(value) {
        if (arguments.length) {
            view = value;
            return this;
        } else {
            return view;
        }
    };

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};
