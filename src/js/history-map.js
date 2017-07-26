// import { smBrowser } from 'provenance/browser'
window.addEventListener('load', () => {
    // Data
    var backgroundPage = chrome.extension.getBackgroundPage(),
        data, mod,
        curationUrl = chrome.extension.getURL('/src/pages/knowledge-map.html'),
        senseHistory = new SenseHistory(backgroundPage.options),
        senseDB = new SenseDB(backgroundPage.options, dbErrShow),
        initedSystem = false, isSelectingNew = true,
        senseConsole = new SenseConsole({debug: backgroundPage.options.debugOthers}),
        pendingTasks = {}, // For jumping to an action when its page isn't ready yet
        closeConfirmation = !backgroundPage.options.debugHistory,
        replayIndex = 1, // index in the actions when replaying
        replayIntervalId;

    // Vis and options
    var collection, formSessionSelect = d3.select('div.form-session-select');

    // background page allows to share data across views
    backgroundPage.data = {nodes: [], links: []};
    mod = sm.provenance.mod();
    startupScreen();
    /**
     * Show a startup screen to enter a session name or select an existed session
     */
    function startupScreen() {
        // Make a list of the saved sessions
        senseDB.listSessions(sessions => {
            if (sessions.length) {
                let selectSessionList = formSessionSelect.select('.saved-sessions').append('ul').on('click', () => {
                    var el = d3.select(d3.event.target),
                        dataId = d3.select(d3.event.target.parentNode).attr('data-id'),
                        mode = 'load';
                    // If it's a command to remove old session
                    if (el.classed('fa-trash-o')) {
                        // mode = 'remove';
                        senseDB.rmSession(dataId, () => {
                            selectSessionList.select('[data-id="' + dataId + '"]').remove();
                        });
                        return;
                    }
                    if (el.classed('fa-download')) {
                        mode = 'download';
                    }
                    senseHistory.description = el.text();
                    // Load or download the saved session
                    senseDB.loadSession(dataId, (sessionData, type) => {
                        var selectSessionList = formSessionSelect.select('.saved-sessions').select('ul');
                        if (!sessionData) {
                            return;
                        }
                        if (mode == 'download') {
                            if (type == 'local') {
                                let zip = new JSZip(sessionData.uint8arr);
                                SenseZip.saveDataToFile(sessionData.filename, zip.generate({type: 'blob'}));
                            } else {
                                let zip = new SenseZip(senseHistory);
                                zip.makeZipFromAPI(sessionData, zipData => {
                                    SenseZip.saveDataToFile(zipData.filename, zipData.zipBlob);
                                });
                            }
                        } else {
                            formSessionSelect.classed('hide', true);
                            selectSessionList.remove();
                            if (type == 'local') {
                                let zip = new SenseZip(senseHistory, sessionData.uint8arr);
                                zip.extractZip(() => {
                                    startApp(sessionData, {convertDates: false});
                                });
                            } else {
                                sessionData.timestamp = Date.parse(sessionData.creationTime);
                                startApp(sessionData, {convertDates: true});
                            }
                        }
                    });
                });
                sessions.forEach(session => {
                    let sessionLi = selectSessionList.append('li').attr('data-id', session.id);
                    sessionLi.append('div').text(session.description);
                    sessionLi.append('div').attr('data-id', session.id)
                        .append('i').classed({fa: true, 'fa-download': true}).attr('aria-hidden', 'true');
                    sessionLi.append('div').attr('data-id', session.id)
                        .append('i').classed({fa: true, 'fa-trash-o': true}).attr('aria-hidden', 'true');
                });
                formSessionSelect.classed('hide', false);
            }
            /**
             * Start applications using loaded data
             *
             * @param {Object} sessionData
             * @param {{convertDates: Boolean}} options
             */
            function startApp(sessionData, options) {
                var title = sessionData.description || sessionData.name;
                if (sessionData.nodes) {
                    senseHistory.export = sessionData.nodes;
                }
                if (sessionData.actions) {
                    senseHistory.actions = sessionData.actions;
                }
                senseHistory.id = sessionData.timestamp;
                changeTitle(title);
                senseHistory.description = title;
                mod.mergeActions(senseHistory.actions, senseHistory.senseNodes);
                computeZoomLevel(senseHistory.actions);
                senseHistory.listening = true;
                if (initedSystem) {
                    run();
                } else {
                    initSystem();
                }
                isSelectingNew = false;
            }
        });
        // Make behavior to get a new session name
        d3.select('input.new-session').on('keydown', () => {
            if (d3.event.key == 'Enter' && d3.event.target.value != '') {
                let divSavedSession = formSessionSelect.select('.saved-sessions');
                senseHistory.description = d3.event.target.value;
                senseHistory.generateNewId();
                senseDB.initRest();
                formSessionSelect.classed('hide', true);
                changeTitle(senseHistory.description);
                if (initedSystem) {
                    run();
                } else {
                    initSystem();
                }
                divSavedSession.select('ul').remove();
                isSelectingNew = false;
            }
            d3.event.stopPropagation();
        });
    }
    /**
     * Change title for the History Map window
     *
     * @param {String} title
     */
    function changeTitle(title) {
        document.title = senseHistory.options.title + (title ? ' (' + title + ')' : '');
    }
    function run() {
        data = backgroundPage.data;
        senseHistory.cleanAndBuildLookups(() => {
            buildVis();
            var zoomActions = senseHistory.actions.filter(
                a => a.type === 'collection-zoom-in' || a.type === 'collection-zoom-out'
            );
            collection.computeZoomLevel(zoomActions);
            updateVis();

            // It's required the curation view should be opened at the beginning because curate-node action needs
            // the view to determine location
            var view = chrome.extension.getViews().find(v => v.location.href === curationUrl);

            if (view) {
                view.location.reload();

                setTimeout(function() {
                    var curationZoomActions = senseHistory.actions.filter(
                        a => a.type === 'curation-zoom-in' || a.type === 'curation-zoom-out'
                    );
                    if (curationZoomActions.length) {
                        chrome.runtime.sendMessage({type: 'computeZoom', values: curationZoomActions});
                    }
                    chrome.runtime.sendMessage({type: 'redraw'});
                }, 1000);
            }
            senseHistory.on('dataChanged', _.throttle((t, needStore, d) => {
                if (isSelectingNew) {
                    return;
                }
                if (t === 'image') {
                    senseHistory.actions.push({
                        id: d.id,
                        type: 'save-image',
                        value: d.userImage,
                        time: Date.now()
                    });
                }
                // It's core of the auto save feature
                if (backgroundPage.options.autoSave && needStore && senseHistory.listening) {
                    saveWorkspace();
                }
                mod.mergeActions(senseHistory.actions, senseHistory.senseNodes);
                computeZoomLevel(senseHistory.actions);
                redraw();
            }, 200));
        });
    }
    /**
     * Primary mediator to a browser
     */
    function initSystem() {
        run();

        // Show/hide settings
        d3.select('#bars').on('click', toggleToolbar);

        d3.select('#btnNew').on('click', () => {
            collection.resetZoom();
            chrome.runtime.sendMessage({type: 'resetZoom'});
            data = {nodes: [], links: []};
            changeTitle('');
            senseHistory.clearHistory().then(() => {
                mod.mergeActions(senseHistory.actions, senseHistory.senseNodes);
                toggleToolbar();
                redraw();
                isSelectingNew = true;
                senseHistory.listening = false;
                startupScreen();
            });
        });

        // The button Save
        let btnSave = d3.select('#btnSave');
        if (backgroundPage.options.autoSave) {
            btnSave.remove();
        } else {
            btnSave.on('click', () => { toggleToolbar(); saveWorkspace(); });
        }

        d3.select('#btnLoad').on('click', () => { d3.select(this).text(null); });
        $('#btnLoad').change(e => {
            SenseZip.readUploadedFile(e.target, (content, id) => {
                collection.resetZoom();
                chrome.runtime.sendMessage({type: 'resetZoom'});
                senseHistory.id = id;
                let zip = new SenseZip(senseHistory, content);
                zip.extractZip(() => {
                    changeTitle(senseHistory.description);
                    mod.mergeActions(senseHistory.actions, senseHistory.senseNodes);
                    computeZoomLevel(senseHistory.actions);
                    toggleToolbar();
                    redraw();
                });
            });
        });

        d3.select('#btnReplay').on('click', function() {
            replay(1000);
            toggleToolbar();
        });

        d3.select('#btnPause').on('click', function() {
            d3.select(this).html(senseHistory.switchAndGetPauseButton());
            toggleToolbar();
        });

        // The button inspect
        let btnInspect = d3.select('#btnInspect');
        if (backgroundPage.options.debugOthers) {
            btnInspect.on('click', function() {
                var options = backgroundPage.options;
                if (options.inspectWindowsId) {
                    // Bring inspectWindows to the front so the user can see it
                    chrome.windows.update(options.inspectWindowsId, {focused: true});
                } else {
                    chrome.windows.create({
                        url: chrome.extension.getURL('src/pages/event-viewer.html'),
                        type: 'popup',
                        left: 0,
                        top: 0,
                        width: parseInt(screen.width / 2),
                        height: screen.height
                    }, function(w) {
                        options.inspectWindowsId = w.id;
                        chrome.runtime.sendMessage({type: 'redraw'});
                    });
                }
                toggleToolbar();
            });
        } else {
            btnInspect.remove();
        }
        // Add listener to correct closing inspectWindows
        chrome.windows.onRemoved.addListener(cleanOptionsOnRemove);

        d3.select('#btnZoomIn').on('click', function() {
            collection.zoomIn();
            redraw(true);
            senseHistory.actions.push({
                type: 'collection-zoom-in',
                time: Date.now()
            });
        });

        d3.select('#btnZoomOut').on('click', function() {
            collection.zoomOut();
            redraw(true);
            senseHistory.actions.push({
                type: 'collection-zoom-out',
                time: Date.now()
            });
        });

        // Need confirmation when close/reload collection
        if (closeConfirmation) {
            window.onbeforeunload = function() {
                return 'All unsaved data will be gone if you close this window.';
            };
        }

        // d3.select('body').on('mouseover', function() {
        //     chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: true });
        // });

        // Replay by shortcut
        document.addEventListener('keydown', function(e) {
            if (!e.metaKey && !e.ctrlKey) {
                return;
            }

            var prevent = true;

            if (e.keyCode === 80) { // Ctrl + P
                replay(1000);
            } else if (e.keyCode === 84) { // Ctrl + T
                clearInterval(replayIntervalId);
            } else {
                prevent = false;
            }

            if (prevent) {
                e.preventDefault();
            }
        });
        let historyMap = document.getElementById('history-map');
        ['mouseover', 'mouseout'].forEach(event => {
            historyMap.addEventListener(event, handleMouseMotion);
        });
        captureActivities(window, event => {
            chrome.runtime.sendMessage({type: 'col-' + event.type, time: +Date.now()});
        });
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            var tab = sender.tab;
            // Skip this event if it's in the ny ignore event
            if (SenseHistory.isIgnoredEvent(request.type)) {
                return false;
            }
            switch (request.type) {
                case 'requestData':
                    // Get highlights, notes for the requested item
                    sendResponse(senseHistory.actions.filter(d => d.url === tab.url).map(SenseNode.getCoreData));
                    break;
                case 'requestTask':
                    if (pendingTasks[tab.id]) {
                        sendResponse(SenseNode.getCoreData(pendingTasks[tab.id]));
                        delete pendingTasks[tab.id];
                    }
                    break;
                case 'focusWindow':
                    chrome.windows.update(tab.windowId, {focused: true});
                    break;
                case 'redraw':
                    redraw(true);
                    break;
                case 'actionAdded':
                    onActionAdded(request.value);
                    break;
                case 'nodeClicked':
                    onNodeClicked(request.value);
                    break;
                case 'nodeHovered':
                    if (request.view !== 'collection') {
                        collection.setBrushed(request.value, request.status);
                    }
                    break;
                case 'nodeCurationMoved':
                case 'nodeCollectionMoved':
                    // Ignore these events
                    break;
                case 'layoutDone':
                    onLayoutDone(request.value, request.id);
                    break;
                case 'zoomedIn':
                case 'zoomedOut':
                    senseHistory.actions.push({
                        type: request.type === 'zoomedIn' ? 'curation-zoom-in' : 'curation-zoom-out',
                        time: Date.now()
                    });
                    break;
                case 'computeZoom':
                    // Ignore this event
                case 'linkClicked':
                    // See SenseHistory.clickOnLink();
                    break;
                default:
                    senseConsole.warn('Unknown request.type ' + request.type, sender.tab);
                    break;
            }
        });
        initedSystem = true;
    }
    /**
     * Clean window's ids on close the window
     *
     * @param {Number} windowId
     */
    function cleanOptionsOnRemove(windowId) {
        var options = backgroundPage.options;
        switch (windowId) {
            case options.inspectWindowsId:
                delete options.inspectWindowsId;
                break;
            case options.curationWindowId:
                delete options.curationWindowId;
                break;
            default:
                break;
        }
    }

    function captureActivities(view, handle) {
        // ['focus', 'blur', 'keydown', 'mousewheel', 'mousedown', 'mousemove']
        ['focus', 'blur', 'keydown', 'mousewheel'].forEach(event => {
            view.addEventListener(event, handle);
        });
    }
    /**
     * The single handler in the system to the mouse events: 'mouseover', 'mouseout'
     *
     * @param {Object} event
     */
    function handleMouseMotion(event) {
        var target = event.target;
        // Check for the attribute data-node
        if (target.hasAttribute('data-node')) {
            collection.doMouseNode(event.type, target);
        } else if (target.parentNode.hasAttribute('data-node')) {
            collection.doMouseNode(event.type, target.parentNode);
        // Check for the attribute data-parent or data-highlight
        } else if (target.hasAttribute('data-parent') || target.hasAttribute('data-highlight')) {
            collection.doMouseHighlight(event.type, target);
        } else if (target.parentNode.hasAttribute('data-parent') || target.parentNode.hasAttribute('data-highlight')) {
            collection.doMouseHighlight(event.type, target.parentNode);
        }
        event.preventDefault();
    }

    function toggleToolbar() {
        var btnToolBar = d3.select('.btn-toolbar');
        btnToolBar.classed('hide', isSelectingNew || !btnToolBar.classed('hide'));
    }
    /**
     * Change title while saving the workspace
     */
    function saveWorkspace() {
        var description = senseHistory.description;
        changeTitle('Saving the session ' + description + '...');
        senseDB.saveWorkspace(senseHistory, () => {
            changeTitle('The session ' + description + ' have stored successful');
            setTimeout(() => {
                changeTitle(description);
            }, 1000);
        });
    }

    function computeZoomLevel(actions) {
        if (!collection) {
            return;
        }

        // Zoom for collection
        collection.computeZoomLevel(actions.filter(
            a => a.type === 'collection-zoom-in' || a.type === 'collection-zoom-out'
        ));

        // Zoom for curation
        var curationZoomActions = actions.filter(
            a => a.type === 'curation-zoom-in' || a.type === 'curation-zoom-out'
        );
        chrome.runtime.sendMessage({type: 'computeZoom', values: curationZoomActions});
    }

    function buildVis() {
        // Todo Here is a place for the new object SenseHistory
        collection = sm.vis.collection(senseHistory)
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

    function replay(timeStep) {
        collection.resetZoom();
        chrome.runtime.sendMessage({type: 'resetZoom'});

        var relevantActions = senseHistory.actions.filter(a => a.type !== 'click-node' && a.type !== 'revisit');

        replayIntervalId = setInterval(() => {
            mod.mergeActions(relevantActions.slice(0, replayIndex), senseHistory.senseNodes);

            var currentAction = relevantActions[replayIndex - 1];
            switch (currentAction.type) {
                case 'collection-zoom-in':
                    collection.zoomIn();
                    break;
                case 'collection-zoom-out':
                    collection.zoomOut();
                    break;
                case 'curation-zoom-in':
                    chrome.runtime.sendMessage({type: 'toZoomIn'});
                    break;
                case 'curation-zoom-out':
                    chrome.runtime.sendMessage({type: 'toZoomOut'});
                    break;
                default:
                    senseConsole.warn('replay: Unknown type ' + currentAction.type);
                    break;
            }
            redraw();

            replayIndex++;
            if (count > relevantActions.length) {
                clearInterval(replayIntervalId);
            }
        }, timeStep);
    }

    function updateVis() {
        collection.width(window.innerWidth).height(window.innerHeight);
        redraw(true);
    }

    function redraw(external) {
        if (collection) {
            d3.select('.sm-collection-container').datum(data).call(collection);
        }

        if (!external) {
            chrome.runtime.sendMessage({type: 'redraw'});
        }
    }
    /**
     * Handler to automatic create/restore the Knowledge Map view
     */
    function onCurated() {
        var options = backgroundPage.options;
        if (options.curationWindowId) {
            if (options.inSeparatedTab) {
                chrome.tabs.update(options.curationWindowId, {active: true});
            } else {
                chrome.windows.update(options.curationWindowId, {focused: true});
            }
            chrome.runtime.sendMessage({type: 'redraw'});
        } else {
            knowledgeMapStart(() => {
                // Look for knowledge-map.html
                let view = chrome.extension.getViews().find(v => v.location.href === curationUrl);
                if (view) {
                    captureActivities(view, handleCuration);
                    // 3 lines below are candidates to remove. These events were moved from History Map as extra things
                    ['mousedown', 'mousemove'].forEach(event => {
                        view.addEventListener(event, handleCuration);
                    });
                }
            });
        }
        function handleCuration() {
            chrome.runtime.sendMessage({type: 'cur-' + this.event.type, time: +Date.now()});
        }
    }
    /**
     * Create the Knowledge Map view
     *
     * @param {String|Function} [state]
     * @param {Function} [callback]
     */
    function knowledgeMapStart(state, callback) {
        var options = backgroundPage.options;
        switch (typeof state) {
            case 'string':
                if (state === 'minimized') {
                    windowParams.state = 'minimized';
                }
                break;
            case 'function':
                callback = state;
                break;
            default:
                break;
        }
        if (options.inSeparatedTab) {
            chrome.tabs.create({url: curationUrl}, postOpenedAction);
        } else {
            chrome.windows.create({
                url: curationUrl,
                type: 'popup',
                left: 0,
                top: 0,
                width: parseInt(screen.width / 3),
                height: screen.height
            }, postOpenedAction);
        }
        /**
         * Launch post opened action
         *
         * @param {Object} curationInfo
         */
        function postOpenedAction(curationInfo) {
            options.curationWindowId = curationInfo.id;
            if (typeof callback == 'function') {
                callback(curationInfo);
            }
            chrome.runtime.sendMessage({type: 'redraw'});
        }
    }

    function onActionAdded(d) {
        senseHistory.actions.push(d);
    }

    function onLayoutDone(rp, id) {
        senseHistory.actions.push({
            id: id,
            type: 'curate-node',
            time: Date.now(),
            trp: rp
        });
    }

    function onNodeClicked(node) {
        senseConsole.log('onNodeClicked: ', node);
        chrome.tabs.query({}, tabs => {
            var tab = tabs.find(t => t.url === node.url);
            if (tab) {
                senseHistory.clickNodeExistedTab(node, tab);
            } else {
                // Can't find it, already closed, open new item, request scrolling later on
                chrome.tabs.create({url: node.url}, tab => {
                    node.windowId = tab.windowId;
                    node.tabId = tab.id;
                    chrome.windows.update(tab.windowId, {focused: true});
                    pendingTasks[tab.id] = node;
                });
            }
        });
    }
    /**
     * Show a error message in the div.status
     *
     * @param {*} event
     */
    function dbErrShow(event) {
        var status = d3.select('div.status');
        if (status) {
            status.classed({hide: false, error: true}).text(event.target.error.message);
            setTimeout(() => {
                status.classed({hide: true, error: false}).text('');
            }, 3000);
        }
        console.error(event);
    }
});
