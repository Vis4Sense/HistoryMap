/**
 * browser captures user actions in the Chrome browser.
 */
sm.provenance.browser = function() {
    var module = {};

    var actions = [], // The input/output array of actions
        listening = true,
        provAction = sm.provenance.action(),
        prevUrl, // The url of the last action
        urlToActionLookup = {}, // url -> action (data object) if the page was visited (first visit) and captured
        tabIdToActionLookup = {}, // tabId -> action
        urlToReferrerLookup = {}; // url -> its source url

    var dispatch = d3.dispatch('dataChanged');

    function init() {
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        chrome.tabs.onActivated.addListener(onTabActivated);
        chrome.tabs.onRemoved.addListener(onTabRemoved);
        chrome.runtime.onMessage.addListener(onMessageReceived);
        createContextMenus();
        addLinkHandler();
        updatePageEndTime();
    }

    init();

    // Couldn't distinguish between auto reload and normal first load.
    // I don't want to include auto reload page. So, don't capture revisit here at all.
    // If the user opens a revisited page, accept a known bug that it's not captured.
    function onTabUpdated(tabId, changeInfo, tab) {
        if (!listening || isTabIgnored(tab) || isTabInComplete(tab)) return;

        // Close status
        actions.forEach(a => {
            a.closed = true;
        });
        chrome.tabs.query({}, tabs => {
            tabs.forEach(t => {
                var n = urlToActionLookup[t.url];
                if (n) {
                    n.closed = false;
                }
            });
        });

        // Either add new action or update it (with favIconUrl)
        var action = urlToActionLookup[tab.url];
        if (action) {
            // After a tab is complete, 'favIconUrl' can still be updated.
            if (!action.favIconUrl) {
                updateAction(tab);
            }

            if (tab.active) {
                action.seen = true;
                actions.forEach(a => {
                    a.highlighted = action === a;
                });
                dispatch.dataChanged('highlighted');

                // Capture a snapshot if not yet
                if (!action.image) takeSnapshot(tab.windowId, action);
            }
        } else {
            addAction(tab);
        }
    }

    function isTabInComplete(tab) {
        return tab.status !== 'complete';
    }

    function isTabIgnored(tab) {
        var ignoredUrls = [ 'chrome://', 'chrome-extension://', 'chrome-devtools://', 'view-source:', 'google.co.uk/url', 'google.com/url', 'localhost://' ];
        return ignoredUrls.some(url => tab.url.includes(url));
    }

    function addAction(tab) {
        // Action is more important than visit type
        var action = provAction.extract(prevUrl && new URL(prevUrl), new URL(tab.url));
        if (action) {
            if (action !== 'skip') {
                if (isSearchType(action.type)) { // Search action can have referrer coming from a link
                    getVisitType(tab.url, tab.id, type => {
                        createNewAction(tab, action.type, action.label);
                    });
                } else {
                    var prevAction = urlToActionLookup[prevUrl];
                    var a = createNewAction(tab, action.type, action.label);
                    // Set the original page of the filter
                    if (action.type === 'filter' && prevAction) {
                        a.from = prevAction.type === 'filter' ? prevAction.from : prevAction.id;
                    }
                }
            }
        } else {
            getVisitType(tab.url, tab.id, type => {
                createNewAction(tab, type);
            });
        }
    }

    function addRevisitAction(tab) {
        createNewAction(tab, 'revisit');
    }

    function getVisitType(url, tabId, callback) {
        chrome.history.getVisits({ url: url }, results => {
            if (!results || !results.length) return;

            // The latest one contains information about the just completely loaded page
            var visitTransition = _.last(results).transition,
                bookmarkTypes = [ 'auto_bookmark' ],
                typedTypes = [ 'typed', 'generated', 'keyword', 'keyword_generated' ],
                type = bookmarkTypes.includes(visitTransition) ? 'bookmark' :
                    typedTypes.includes(visitTransition) ? 'type' : 'link';

            callback(type);
        });
    }

    function isEmbeddedType(type) {
        return [ 'highlight', 'note', 'filter' ].includes(type);
    }

    function isSearchType(type) {
        return [ 'search', 'location', 'dir' ].includes(type);
    }

    function createNewAction(tab, type, text, path, classId) {
        // Still need to check the last time before creating a new action
        // because two updates can happen in a very short time, thus the second one
        // happens even before a new action is added in the first update
        var action,
            originalAction = urlToActionLookup[tab.url];

        if (type === 'revisit') {
            action = createActionObject(tab.id, originalAction.url, originalAction.text, type, originalAction.favIconUrl);
            dispatch.dataChanged(type, true);
        } else if (type === 'highlight' || type === 'filter') {
            action = createActionObject(tab.id, tab.url, text, type, undefined, path, classId);
            if (type === 'filter') urlToActionLookup[tab.url] = action;
            dispatch.dataChanged(type, true);
        } else {
            if (originalAction) {
                updateAction(tab);
            } else {
                action = createActionObject(tab.id, tab.url, text || tab.title || tab.url || '', type, tab.favIconUrl);
                action.seen = action.highlighted = tab.active;
                urlToActionLookup[tab.url] = action; // Maintain the first visit
                tabIdToActionLookup[tab.id] = action;
                dispatch.dataChanged(type, true);

                // Page snapshot
                if (tab.active) takeSnapshot(tab.windowId, action);
            }
        }

        if (action) {
            prevUrl = action.url;

            // Only the newly created tab is active
            if (tab.active && !isEmbeddedType(type)) {
                actions.forEach(a => {
                    a.highlighted = action === a;
                });
            }
        }

        return action;
    }

    var lastDate;

    function createActionObject(tabId, url, text, type, favIconUrl, path, classId) {
        var time = new Date(),
            action = {
                id: +time,
                time: time,
                url: url,
                text: text,
                type: type,
                showImage: true
            };

        if (favIconUrl) action.favIconUrl = favIconUrl;
        if (path) action.path = path;
        if (classId) action.classId = classId;

        if (!isEmbeddedType(type)) {
            // End time
            action.endTime = action.id + 1;
        }

        if (lastDate && action.id === +lastDate) action.id += 1;
        lastDate = time;

        // Referrer
        // console.log('find: ' + url);
        var rUrl = urlToReferrerLookup[url];
        if (rUrl) {
            var r = urlToActionLookup[rUrl];
            if (r) action.from = r.id;
        } else {
            // Use document.referrer if available. This is less accurate because referrer only return the path excluding hash.
            chrome.tabs.sendMessage(tabId, { type: 'askReferrer' }, function(response) {
                if (response) {
                    var r = _.findLast(actions, a => a.url && a.url === response && !isEmbeddedType(a.type));
                    if (r) action.from = r.type === 'revisit' ? r.from : r.id;
                }
            });
        }

        actions.push(action);

        return action;
    }

    function takeSnapshot(windowId, action) {
        captureWindow(windowId, action.url, function(dataUrl) {
            if (!action.image) {
                action.image = dataUrl;
                dispatch.dataChanged('snapshot');
            }
        });
    }

    function captureWindow(windowId, url, callback) {
        // In some pages, tab.status can be complete first, then use ajax to load content.
        // So, need to wait a bit (not really know how much) before capturing.
        setTimeout(function() {
            // Check again if the tab is going to be captured is the same as the tab needs to capture.
            // Otherwise, if the user stays in a tab less than the waiting amount, wrong tab could be captured.
            chrome.tabs.query({ windowId: windowId, active: true }, tabs => {
                if (!tabs.length) return;
                if (tabs[0].url !== url) return;

                chrome.windows.get(windowId, function(window) {
                    if (window.focused) {
                        chrome.tabs.captureVisibleTab(windowId, { format: "png" }, function(dataUrl) {
                            if (!dataUrl) return;

                            // Resize image because only need thumbnail size
                            sm.resizeImage(dataUrl, 192, 150, callback);
                        });
                    }
                });
            });
        }, 1000);
    }

    function updateAction(tab) {
        var action = urlToActionLookup[tab.url];
        if (tab.active) action.seen = true;

        // The only practical update I've seen!
        if (tab.favIconUrl && tab.favIconUrl !== action.favIconUrl) {
            action.favIconUrl = tab.favIconUrl;
            dispatch.dataChanged('update');
        }
    }

    function onTabActivated(activeInfo) {
        if (!listening) return;

        // Either add a 'revisit' action or a normal action (happen when switch to a tab which was opened before the extension)
        chrome.tabs.query({ windowId: activeInfo.windowId, active: true }, tabs => {
            // Dehighlight all, only highlight the active one later
            actions.forEach(a => {
                a.highlighted = false;
            });

            if (!tabs.length) {
                dispatch.dataChanged('highlighted');
                return;
            }

            var tab = tabs[0];
            if (isTabIgnored(tab) || isTabInComplete(tab)) {
                dispatch.dataChanged('highlighted');
                return;
            }

            var action = urlToActionLookup[tab.url];
            if (action) {
                // If this is the first time the tab is activated (can be a result of 'open in new tab')
                // set it's seen, otherwise, this is a revisit.
                if (action.seen) {
                    addRevisitAction(tab);
                } else {
                    action.seen = true;
                    dispatch.dataChanged('seen');
                }

                // Capture a snapshot if not yet
                if (!action.image) takeSnapshot(activeInfo.windowId, action);

                // Highlight the active page
                action.highlighted = true;
                dispatch.dataChanged('highlighted');
            } else {
                addAction(tab);
            }
        });
    }

    function onTabRemoved(tabId, removeInfo) {
        var n = tabIdToActionLookup[tabId];
        if (n) {
            n.closed = true;
            n.highlighted = false;
            dispatch.dataChanged('tabClosed');
        }
    }

    function onMessageReceived(request, sender, sendResponse) {
        if (request.type === 'noted') {
            var action = actions.find(a => a.url === sender.tab.url && a.classId === request.data.classId);
            action.text = request.data.text;
            action.type = 'note';
            dispatch.dataChanged(request.type);
        } else if (request.type === 'highlightRemoved') {
            _.remove(actions, a => a.url === sender.tab.url && a.classId === request.classId);
            dispatch.dataChanged(request.type, true);
        }
    }

    function updatePageEndTime() {
        // After every a fix amount of seconds,
        // - gets the currently active tab in the browser
        // - updates reading time of the 'currently stored' active tab
        setInterval(() => {
            // Get active tab
            chrome.tabs.query({ active: true }, tabs => {
                tabs.forEach(tab => {
                    if (isTabIgnored(tab) || isTabInComplete(tab)) return;

                    var action = _.findLast(actions, a => a.url === tab.url);
                    if (action) {
                        action.endTime = new Date();
                    }
                });
            });
        }, 1000);
    }

    function createContextMenus() {
        chrome.contextMenus.removeAll();

        // To highlight selected text
        chrome.contextMenus.create({
            id: 'sm-highlight',
            title: 'Highlight',
            contexts: ['selection']
        });

        // To save image
        chrome.contextMenus.create({
            id: 'sm-save-image',
            title: 'Set as Page Image',
            contexts: ['image']
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'sm-highlight') {
                chrome.tabs.sendMessage(tab.id, { type: 'highlightSelection' }, d => {
                    if (d) createNewAction(tab, 'highlight', d.text, urlToActionLookup[tab.url], d.path, d.classId);
                });
            } else if (info.menuItemId === 'sm-save-image') {
                // Overwrite existing image
                var action = urlToActionLookup[tab.url];
                if (action) {
                    action.image = info.srcUrl;
                    action.userImage = true;
                    dispatch.dataChanged('image');
                }
            }
        });
    }

    function addLinkHandler() {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.type === 'linkClicked') {
                request.values.forEach(v => {
                    // console.log('received: ' + v);
                    urlToReferrerLookup[v] = sender.tab.url;
                });
            }
        });
    }

    function buildLookups(callback) {
        // Build lookup using loaded actions
        var duplicateUrlTypes = [ 'highlight', 'note', 'revisit' ];
        urlToActionLookup = {};
        actions.filter(a => a.url && !duplicateUrlTypes.includes(a.type)).forEach(action => {
            urlToActionLookup[action.url] = action;
            action.closed = true;
        });

        // Build lookup using opening tabs
        tabIdToActionLookup = {};
        chrome.tabs.query({}, tabs => {
            tabs.forEach(t => {
                var n = urlToActionLookup[t.url];
                if (n) {
                    tabIdToActionLookup[t.id] = n;
                    n.closed = false;
                    if (t.active) {
                        n.highlighted = n.seen = true;
                    }
                }
            });

            callback();
        });
    }

    /**
     * Sets/gets the capturing actions.
     */
    module.actions = function(value, callback) {
        if (!arguments.length) return actions;
        actions = value;
        buildLookups(callback);
        return this;
    };

    /**
     * Captures user actions.
     */
    module.capture = function(value) {
        listening = value;
        return this;
    };

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};