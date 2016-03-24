$(function() {
    // Data
    var backgroundPage = chrome.extension.getBackgroundPage(),
        data = backgroundPage.data = { nodes: [], links: [] }, // background page allows to share data across views
        actions = [], // All actions added in temporal order including 'revisit' and 'child' actions
        browser = sm.provenance.browser(),
        mod = sm.provenance.mod(),
        browsingActions = [],
        pendingTasks = {}, // For jumping to an action when its page isn't ready yet
        debugging = backgroundPage.debugging,
        closeConfirmation = !debugging,
        datasetName = debugging ? 'data/test2.zip' : '';
        // datasetName = '';

    // Vis and options
    var collection,
        curationWindowId,
        listening = true;

    respondToContentScript();
    run();

    function run() {
        if (datasetName) {
            // Load data
            if (datasetName.endsWith('.json')) {
                d3.json(datasetName, data => {
                    loadWorkspace(data, true);
                    main();
                });
            } else {
                JSZipUtils.getBinaryContent(datasetName, (err, data) => {
                    loadWorkspace(data);
                    main();
                });
            }
        } else {
            main();
        }

        initSettings();
        captureActivities(window, handleCollection);
    }

    function initSettings() {
        // Show/hide settings
        d3.select('#bars').on('click', toggleToolbar);

        d3.select('#btnNew').on('click', () => {
            collection.resetZoom();
            chrome.runtime.sendMessage({ type: 'resetZoom' });

            actions = [];
            data.nodes = [];
            data.links = [];
            browsingActions = [];
            browser.browsingActions(browsingActions);
            browser.actions(actions, function() {
                redraw();
                toggleToolbar();
            });
        });

        d3.select('#btnSave').on('click', function() {
            saveWorkspace();
            toggleToolbar();
        });

        $('#btnLoad').click(e => {
            $(this).val(null);
        });
        $('#btnLoad').change(e => {
            sm.readUploadedFile(e, content => {
                loadWorkspace(content, false, true);
                redraw();
                toggleToolbar();
            }, true);
        });

        d3.select('#btnReplay').on('click', function() {
            replay(1000);
            toggleToolbar();
        });

        d3.select('#btnPause').on('click', function() {
            listening = !listening;
            var html = listening ? "<i class='fa fa-pause'></i> Pause" : "<i class='fa fa-play'></i> Resume";
            d3.select(this).html(html);
            browser.capture(listening);
            toggleToolbar();
        });

        d3.select('#btnZoomIn').on('click', function() {
            collection.zoomIn();
            redraw(true);
            actions.push({
                type: 'collection-zoom-in',
                time: new Date()
            });
        });

        d3.select('#btnZoomOut').on('click', function() {
            collection.zoomOut();
            redraw(true);
            actions.push({
                type: 'collection-zoom-out',
                time: new Date()
            });
        });

        // Need confirmation when close/reload collection
        if (closeConfirmation) {
            window.onbeforeunload = function() {
                return "All unsaved data will be gone if you close this window.";
            };
        }

        // d3.select('body').on('mouseover', function() {
        //     chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: true });
        // });

        // Replay by shortcut
        $(document).on("keydown", function(e) {
            if (!e.metaKey && !e.ctrlKey) return;

            var prevent = true;

            if (e.keyCode === 80) { // Ctrl + P
                replay(1000);
            } else {
                prevent = false;
            }

            if (prevent) e.preventDefault();
        });
    }

    function captureActivities(w, handle) {
        w.addEventListener("focus", handle);
        w.addEventListener("blur", handle);
        w.addEventListener("keydown", handle);
        w.addEventListener("mousewheel", handle);
        w.addEventListener("mousedown", handle);
        w.addEventListener("mousemove", handle);
    }

    function handleCollection() {
        chrome.runtime.sendMessage({ type: 'col-' + this.event.type, time: +new Date() });
    }

    function handleCuration() {
        chrome.runtime.sendMessage({ type: 'cur-' + this.event.type, time: +new Date() });
    }

    function toggleToolbar() {
        d3.select('.btn-toolbar').classed('hide', !d3.select('.btn-toolbar').classed('hide'));
    }

    function main() {
        browser.browsingActions(browsingActions);
        browser.actions(actions, function() {
            buildVis();
            collection.computeZoomLevel(actions.filter(a => a.type === 'collection-zoom-in' || a.type === 'collection-zoom-out'));
            updateVis();

            // It's required the curation view should be opened at the beggining because curate-node action needs the view to determine location
            var url = chrome.extension.getURL('src/pages/curation-view.html');
            var view = chrome.extension.getViews().find(v => v.location.href === url);

            if (view) {
                view.location.reload();

                setTimeout(function() {
                    var curationZoomActions = actions.filter(a => a.type === 'curation-zoom-in' || a.type === 'curation-zoom-out');
                    chrome.runtime.sendMessage({ type: 'computeZoom', values: curationZoomActions });
                    chrome.runtime.sendMessage({ type: 'redraw' });
                }, 1000);
            } else {
                chrome.windows.create({
                    url: chrome.extension.getURL('src/pages/curation-view.html'),
                    type: "popup",
                    state: "minimized"
                }, function(w) {
                    curationWindowId = w.id;

                    setTimeout(function() {
                        var curationZoomActions = actions.filter(a => a.type === 'curation-zoom-in' || a.type === 'curation-zoom-out');
                        chrome.runtime.sendMessage({ type: 'computeZoom', values: curationZoomActions });
                        chrome.runtime.sendMessage({ type: 'redraw' });
                    }, 3000);
                });
            }
        }).capture(listening)
        .on('dataChanged', _.throttle(onDataChanged, 200));
    };

    function onDataChanged(t, needRebuild, d) {
        if (t === 'image') {
            actions.push({
                id: d.id,
                type: 'save-image',
                value: d.userImage,
                time: new Date()
            });
        }
        // console.log(t, +new Date());
        mod.mergeActions(actions);
        redraw();
    }

    function loadWorkspace(content, isJson, external) {
        var zip;

        if (isJson) {
            actions = content.data;
        } else {
            zip = new JSZip(content);
            actions = JSON.parse(zip.file('sensemap.json').asText()).data;
        }

        // Convert string date to JS object
        actions.forEach(a => {
            a.time = new Date(a.time);
        });

        mod.mergeActions(actions);

        computeZoomLevel();

        if (!isJson) replaceRelativePathWithDataURI(zip);

        if (external) {
            browsingActions = [];
            browser.browsingActions(browsingActions);
            browser.actions(actions, function() {
                if (collection) redraw();
            });
        }
    }

    function computeZoomLevel() {
        if (!collection) return;

        // Zoom for collection
        collection.computeZoomLevel(actions.filter(a => a.type === 'collection-zoom-in' || a.type === 'collection-zoom-out'));

        // Zoom for curation
        curationZoomActions = actions.filter(a => a.type === 'curation-zoom-in' || a.type === 'curation-zoom-out');
        chrome.runtime.sendMessage({ type: 'computeZoom', values: curationZoomActions });
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

    function respondToContentScript() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            var tab = sender.tab;

            if (request.type === 'requestData') {
                // Get highlights, notes for the requested item
                sendResponse(actions.filter(d => d.url === tab.url).map(mod.getCoreData));
            } else if (request.type === 'requestTask') {
                if (pendingTasks[tab.id]) {
                    sendResponse(mod.getCoreData(pendingTasks[tab.id]));
                    delete pendingTasks[tab.id];
                }
            } else if (request.type === 'focusWindow') {
                chrome.windows.update(tab.windowId, { focused: true });
            } else if (request.type === 'redraw') {
                redraw(true);
            } else if (request.type === 'actionAdded') {
                onActionAdded(request.value);
            } else if (request.type === 'nodeClicked') {
                onNodeClicked(request.value);
            } else if (request.type === 'nodeHovered' && request.view !== 'collection') {
                collection.setBrushed(request.value, request.status);
            } else if (request.type === 'layoutDone') {
                onLayoutDone(request.value, request.id);
            } else if (request.type === 'zoomedIn') {
                actions.push({
                    type: 'curation-zoom-in',
                    time: new Date()
                });
            } else if (request.type === 'zoomedOut') {
                actions.push({
                    type: 'curation-zoom-out',
                    time: new Date()
                });
            }
        });
    }

    function buildVis() {
        collection = sm.vis.collection()
            .label(d => d.text)
            .icon(d => d.favIconUrl)
            .on('curated', onCurated);

        mod.view('collection')
            .on('redrawn', redraw)
            .on('actionAdded', onActionAdded)
            .on('nodeClicked', onNodeClicked)
            .handleEvents(collection);

        $(window).resize(_.throttle(updateVis, 200));

        // d3.select('#btnCurate').text(collection.curated() ? 'Pan' : 'Select');
    }

    function saveWorkspace() {
        var zip = new JSZip();

        // Images: replace dataURL with local files to reduce the size of main file
        var coreData = actions.map(mod.getCoreData);
        coreData.filter(d => d.image).forEach(d => {
            if (d.image.startsWith('data')) {
                var filename = d.id + '.png';
                // base64 data doesn't have 'data:image/png;base64,'
                zip.folder('images').file(filename, d.image.split('base64,')[1], { base64: true });
                d.image = filename;
            }
        });

        // Main file
        zip.file('sensemap.json', JSON.stringify({ data: coreData }, null, 4));

        // Browsing file
        zip.file('browser.json', JSON.stringify({ data: browsingActions }, null, 4));

        // Zip and download
        var filename = d3.time.format('%Y%m%d%H%M%S')(new Date()) + '-sensemap.zip';
        sm.saveDataToFile(filename, zip.generate({ type: 'blob' }), false, true);
    }

    function replay(timeStep) {
        collection.resetZoom();
        chrome.runtime.sendMessage({ type: 'resetZoom' });

        var count = 1,
            relevantActions = actions.filter(a => a.type !== 'click-node' && a.type !== 'revisit');

        var intervalId = setInterval(() => {
            mod.mergeActions(relevantActions.slice(0, count));

            var currentAction = relevantActions[count - 1];
            if (currentAction.type === 'collection-zoom-in') collection.zoomIn();
            if (currentAction.type === 'collection-zoom-out') collection.zoomOut();
            if (currentAction.type === 'curation-zoom-in') chrome.runtime.sendMessage({ type: 'toZoomIn' });
            if (currentAction.type === 'curation-zoom-out') chrome.runtime.sendMessage({ type: 'toZoomOut' });

            redraw();

            console.log(currentAction.type);
            count++;
            if (count > relevantActions.length) clearInterval(intervalId);
        }, timeStep);
    }

    function updateVis() {
        collection.width(window.innerWidth).height(window.innerHeight);
        redraw(true);
    }

    function redraw(external) {
        if (collection) d3.select('.sm-collection-container').datum(data).call(collection);

        if (!external) chrome.runtime.sendMessage({ type: 'redraw' });
    }

    var firstTime = true,
        registered = false;
    function onCurated(d) {
        var url = chrome.extension.getURL('src/pages/curation-view.html');
        var view = chrome.extension.getViews().find(v => v.location.href === url);

        if (view) {
            if (!registered) {
                captureActivities(view, handleCuration);
                registered = true;
            }

            if (curationWindowId !== undefined) {
                var o = { focused: true };
                if (firstTime) {
                    o.left = o.top = 0;
                    o.width = screen.width / 2;
                    o.height = screen.height;
                    firstTime = false;
                }

                chrome.windows.update(curationWindowId, o);
            }
            chrome.runtime.sendMessage({ type: 'redraw' });
        } else {
            var numCuratedNodes = data.nodes.filter(n => n.curated && !n.curationRemoved).length;

            // Note: should open curation view if there're some curated nodes
            if (d || numCuratedNodes) {
                chrome.windows.create({
                    url: chrome.extension.getURL('src/pages/curation-view.html'),
                    type: "popup",
                    left: 0,
                    top: 0,
                    width: screen.width / 2,
                    height: screen.height
                }, function(w) {
                    curationWindowId = w.id;
                    chrome.runtime.sendMessage({ type: 'redraw' });
                });
            }
        }
    }

    function onActionAdded(d) {
        d.time = new Date(d.time);
        actions.push(d);
    }

    function onLayoutDone(rp, id) {
        actions.push({
            id: id,
            type: 'curate-node',
            time: new Date(),
            trp: rp
        });
    }

    function onNodeClicked(d) {
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
});