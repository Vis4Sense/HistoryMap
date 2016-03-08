$(function() {
    // Data
    var data = { nodes: [], links: [] }, // The data will be passed to the vis
        actions = [], // All actions added in temporal order including 'revisit' and 'child' actions
        browser = sm.provenance.browser(),
        startRecordingTime,
        pendingTasks = {}, // For jumping to an action when its page isn't ready yet
        closeConfirmation = false,
        name = 'camera', // For quick test/analysis: preload data to save time loading files in the interface
        datasets = {
            complex: 'data/complex.json',
            wrong: 'data/wrong.json',
            inner: 'data/inner.json',
            z: 'data/20160304164424-sensemap.zip',
            camera: 'data/camera.zip',
            ugly: 'data/ugly-simple-link.zip'
        };

    // Vis and options
    var sensemap,
        listening = true;

    function run() {
        // Read options from saved settings
        chrome.storage.sync.get(null, items => {
            // Always listening now for easy testing
            listening = true;

            if (name) {
                // Load data
                if (datasets[name].endsWith('.json')) {
                    d3.json(datasets[name], data => {
                        loadWorkspace(data, true);
                        main();
                    });
                } else {
                    JSZipUtils.getBinaryContent(datasets[name], (err, data) => {
                        loadWorkspace(data);
                        main();
                    });
                }
            } else {
                startRecordingTime = new Date();
                main();
            }
        });

        initSettings();
    }

    function initSettings() {
        // Show/hide settings
        d3.select('#bars').on('click', function() {
            d3.select('.btn-toolbar').classed('hide', !d3.select('.btn-toolbar').classed('hide'));
        });

        d3.select('#btnNew').on('click', () => {
            actions = [];
            data.nodes = [];
            data.links = [];
            browser.actions(actions, function() {
                redraw(true);
            });
        });

        d3.select('#btnSave').on('click', saveWorkspace);

        $('#btnLoad').change(e => {
            sm.readUploadedFile(e, content => {
                loadWorkspace(content);
                redraw(true);
            }, true);
        });

        d3.select('#btnFrezze').on('click', function() {
            sensemap.frozen(true);
        });

        // Need confirmation when close/reload sensemap
        if (closeConfirmation) {
            window.onbeforeunload = function() {
                return "All unsaved data will be gone if you close this window.";
            };
        }
    }

    function main() {
        browser.actions(actions, function() {
            buildVis();
            updateVis();
            wheelHorizontalScroll();
        }).capture()
        .on('dataChanged', _.throttle(onDataChanged, 200));
    };

    function onDataChanged(p) {
        console.log(p, +new Date());
        buildHierarchy(actions);
        redraw(true);
    }

    run();

    var firstTime = true;
    function loadWorkspace(content, isJson) {
        var zip;

        if (isJson) {
            actions = content.data;
        } else {
            zip = new JSZip(content);
            actions = JSON.parse(zip.file('sensemap.json').asText()).data;
        }

        data.links = [];
        buildHierarchy(actions);

        if (!isJson) replaceRelativePathWithDataURI(zip);

        if (!firstTime) {
            browser.actions(actions, function() {
                if (sensemap) redraw(true);
            });
            firstTime = false;
        }
    }

    function replaceRelativePathWithDataURI(zip) {
        _.forEach(zip.files, f => {
            if (f.dir || f.name === 'sensemap.json') return;

            var a = actions.find(a => a.image === f.name.split('/')[1]);
            if (a) {
                // Don't use blob: it makes it unable to resave image file
                // a.image = URL.createObjectURL(new Blob([zip.file(f.name).asArrayBuffer()], { type : 'image/png' }));
                var bf = zip.file(f.name).asArrayBuffer();
                a.image = 'data:image/png;base64,' + btoa([].reduce.call(new Uint8Array(bf), (p, c) => p + String.fromCharCode(c), ''));
            }
        });
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

    // Convert flat list of actions to parent-children network, then redraw the vis.
    function buildHierarchy(actions) {
        // Ignore 'revisit' actions for navigation
        _.remove(actions, a => a.type === 'revisit');

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
            if (d.type === 'link') {
                var source = actions.find(d2 => d2.id === d.from);
                if (source) {
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
            var n = getActionById(a.id);
            if (a.type === 'remove-node' && n) n.removed = true;
            if (a.type === 'renode' && n) n.removed = false;
            if (a.type === 'favorite-node' && n) n.favorite = true;
            if (a.type === 'unfavorite-node' && n) n.favorite = false;
            if (a.type === 'minimize-node' && n) n.minimized = true;
            if (a.type === 'restore-node' && n) n.minimized = false;
        });

        // - Then add to the link list
        // -- Automatic links
        data.nodes.filter(d => d.links).forEach(d => {
            d.links.forEach(c => {
                if (data.nodes.includes(c)) {
                    if (!getLinkByIds(d.id, c.id)) data.links.push({ source: d, target: c });
                }
            });
        });

        // -- User links
        actions.filter(a => isNonActionType(a.type)).forEach(a => {
            var l = getLinkByIds(a.sourceId, a.targetId);
            if (a.type === 'add-link' && !l) data.links.push({ source: getActionById(a.sourceId), target: getActionById(a.targetId), isUserAdded: true });
            if (a.type === 'remove-link' && !l) _.remove(data.links, l);
            if (a.type === 'hide-link' && l) l.hidden = true;
            if (a.type === 'relink' && l) l.hidden = false;
        });
    }

    function getActionById(id) {
        return actions.find(a => a.id === id);
    }

    function getLinkByIds(sourceId, targetId) {
        return data.links.find(l => l.source.id === sourceId && l.target.id === targetId);
    }

    function isEmbeddedType(type) {
        return [ 'highlight', 'note', 'filter' ].includes(type);
    }

    function isNonActionType(type) {
        return [ 'click-node', 'remove-node', 'renode', 'favorite-node', 'unfavorite-node',
            'minimize-node', 'restore-node', 'add-link', 'remove-link', 'hide-link', 'relink' ].includes(type);
    }

    function respondToContentScript() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!listening) return;

            var tab = sender.tab;

            if (request.type === 'dataRequested') {
                // Get highlights, notes for the requested item
                var tabData = actions.filter(d => d.url === tab.url);
                var t = tabData.map(getCoreData);
                sendResponse(t);
            } else if (request.type === 'taskRequested') {
                if (pendingTasks[tab.id]) {
                    var t = getCoreData(pendingTasks[tab.id]);
                    sendResponse(t);
                    delete pendingTasks[tab.id];
                }
            }
        });
    }

    function buildVis() {
        sensemap = sm.vis.sensemap()
            .label(d => d.text)
            .icon(d => d.favIconUrl)
            .on('nodeClicked', onNodeClicked)
            .on('nodeRemoved', d => onNodeHandled('remove-node', d))
            .on('renoded', d => onNodeHandled('renode', d))
            .on('nodeFavorite', d => onNodeHandled('favorite-node', d))
            .on('nodeUnfavorite', d => onNodeHandled('unfavorite-node', d))
            .on('nodeMinimized', d => onNodeHandled('minimize-node', d))
            .on('nodeRestored', d => onNodeHandled('restore-node', d))
            .on('linkAdded', d => onLinkHandled('add-link', d))
            .on('linkRemoved', d => onLinkHandled('remove-link', d))
            .on('linkHidden', d => onLinkHandled('hide-link', d))
            .on('relinked', d => onLinkHandled('relink', d));

        $(window).resize(_.throttle(updateVis, 200));
    }

    function saveWorkspace() {
        var zip = new JSZip();

        // Images: replace dataURL with local files to reduce the size of main file
        var coreData = actions.map(getCoreData);
        coreData.filter(d => d.image).forEach(d => {
            if (d.image.startsWith('data')) {
                var filename = d.id + '.png';
                // base64 data doesn't have 'data:image/png;base64,'
                zip.folder('images').file(filename, d.image.split('base64,')[1], { base64: true });
                d.image = filename;
            }
        });

        // Main file
        zip.file('sensemap.json', JSON.stringify({ startRecordingTime: startRecordingTime, data: coreData }, null, 4));

        // Zip and download
        var filename = d3.time.format('%Y%m%d%H%M%S')(new Date()) + '-sensemap.zip';
        sm.saveDataToFile(filename, zip.generate({ type: 'blob' }), false, true);
    }

    function getCoreData(d) {
        var c = {},
            fields = [ 'id', 'text', 'url', 'type', 'time', 'endTime', 'favIconUrl', 'image', 'classId', 'path', 'from',
            'seen', 'favorite', 'minimized', 'removed', 'removedTime', 'sourceId', 'targetId' ];

        fields.forEach(f => {
            if (d[f] !== undefined) c[f] = d[f];
        });

        return c;
    }

    function replay() {
        var count = 1,
            intervalId = setInterval(() => {
                buildHierarchy(actions.slice(0, count));
                redraw(true);
                count++;

                if (count > actions.length) clearInterval(intervalId);
            }, 1000);
    }

    function onNodeClicked(d) {
        onNodeHandled('click-node', d);

        chrome.tabs.query({}, tabs => {
            var tab = tabs.find(t => t.url === d.url);
            if (tab) {
                // Found it, tell content script to scroll to the element
                chrome.tabs.update(tab.id, { active: true });
                chrome.tabs.sendMessage(tab.id, { type: 'scrollToElement', path: d.path, image: d.image });

                // Get the tab/window in focused as well
                chrome.windows.update(tab.windowId, { focused: true });
            } else {
                // Can't find it, already closed, open new item, request scrolling later on
                chrome.tabs.create({ url: d.url }, tab => {
                    chrome.windows.update(tab.windowId, { focused: true });
                    pendingTasks[tab.id] = d;
                });
            }
        });
    }

    function onNodeHandled(type, d) {
        actions.push({
            type: type,
            id: d.id,
            time: new Date()
        });
    }

    function onLinkHandled(type, d) {
        actions.push({
            type: type,
            sourceId: d.source.id,
            targetId: d.target.id,
            time: new Date()
        });
    }

    function updateVis() {
        sensemap.width(window.innerWidth).height(window.innerHeight);
        redraw();
    }

    function redraw(dataChanged) {
        d3.select('.sm-sensemap-container').datum(data).call(sensemap);
    }

    function wheelHorizontalScroll() {
        var leftMouseDown = false,
            prevX;
        $('body').on('wheel', function(e) {
            this.scrollLeft -= e.originalEvent.wheelDelta;
            e.preventDefault();
        }).on('mousedown', function(e) {
            if (e.which === 1) {
                leftMouseDown = true;
                prevX = e.clientX;
            }
        }).on('mouseup', function(e) {
            leftMouseDown = false;
        }).on('mousemove', function(e) {
            if (leftMouseDown && e.shiftKey) {
                this.scrollLeft -= e.clientX - prevX;
                prevX = e.clientX;
                e.preventDefault();
            }
        });
    }
});