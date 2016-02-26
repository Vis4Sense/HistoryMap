/**
 * browser captures user actions in the Chrome browser.
 */
sm.provenance.browser = function() {
    var module = {};

    var actions = [], // The input/output array of actions
        listening,
        provAction = sm.provenance.action(),
        prevUrl, // The url of the last action
        urlToActionLookup = {}, // url -> action (data object) if the page was visited (first visit) and captured
        tabIdToActionLookup = {}; // tabId -> action

    var dispatch = d3.dispatch('dataChanged');

    function init() {
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        chrome.tabs.onActivated.addListener(onTabActivated);
        chrome.tabs.onRemoved.addListener(onTabRemoved);
        chrome.runtime.onMessage.addListener(onMessageReceived);
        createContextMenus();
        // updatePageEndTime();
    }

    init();

    // Couldn't distinguish between auto reload and normal first load.
    // I don't want to include auto reload page. So, don't capture revisit here at all.
    // If the user opens a revisited page, accept a known bug that it's not captured.
    function onTabUpdated(tabId, changeInfo, tab) {
        if (!listening || isTabIgnored(tab) || isTabInComplete(tab)) return;

        // Either add new action or update it (with favIconUrl)
        var action = urlToActionLookup[tab.url];
        if (action) {
            // After a tab is complete, 'favIconUrl' can still be updated.
            if (!action.favIconUrl) {
                console.log('update: ' + tab.url);
                updateAction(tab);
            }

            if (action.closed) {
                action.closed = false;
                dispatch.dataChanged('tabOpened');
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
                var prevAction = urlToActionLookup[prevUrl];
                var a = createNewAction(tab, action.type, action.label);
                // Set the original page of the filter
                if (action.type === 'filter' && prevAction) {
                    a.from = prevAction.type === 'filter' ? prevAction.from : prevAction.id;
                }
            }
        } else {
            getVisitType(tab.url, tab.id, (type, referrer) => {
                createNewAction(tab, type, undefined, referrer);
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

            // Find the referrer
            if (type === 'link') {
                chrome.tabs.sendMessage(tabId, { type: 'askReferrer' }, function(response) {
                    // referrer only return the path, excluding the hash. So just guess the latest one could be the most likely one.
                    var referrer = response ? actions.slice().reverse().find(a => a.url.startsWith(response) && !isEmbeddedType(a.type)) : null;
                    callback(type, referrer);
                });
            } else {
                callback(type);
            }
        });
    }

    function isEmbeddedType(type) {
        return [ 'highlight', 'note', 'filter' ].includes(type);
    }

    function createNewAction(tab, type, text, referrer, path, classId) {
        // Still need to check the last time before creating a new action
        // because two updates can happen in a very short time, thus the second one
        // happens even before a new action is added in the first update
        var action,
            originalAction = urlToActionLookup[tab.url];

        if (type === 'revisit') {
            action = createActionObject(originalAction.url, originalAction.text, type, originalAction.favIconUrl, originalAction);
            dispatch.dataChanged(type);
        } else if (type === 'highlight' || type === 'filter') {
            action = createActionObject(tab.url, text, type, undefined, referrer, path, classId);
            urlToActionLookup[tab.url] = action;
            dispatch.dataChanged(type);
        } else {
            if (originalAction) {
                updateAction(tab);
            } else {
                action = createActionObject(tab.url, text || tab.title || tab.url || '', type, tab.favIconUrl, referrer);
                action.seen = action.highlighted = tab.active;
                urlToActionLookup[tab.url] = action; // Maintain the first visit
                dispatch.dataChanged(type);

                // Page snapshot
                if (tab.active) takeSnapshot(tab.windowId, action);
            }
        }

        if (action) {
            prevUrl = action.url;

            // Only the newly created tab is active
            if (tab.active) {
                actions.forEach(a => {
                    a.highlighted = action === a;
                });
            }
        }

        return action;
    }

    function createActionObject(url, text, type, favIconUrl, referrer, path, classId) {
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
        if (referrer) action.from = referrer.id;
        if (path) action.path = path;
        if (classId) action.classId = classId;

        if (!isEmbeddedType(type)) {
            // End time
            action.endTime = action.id + 1;
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

                chrome.tabs.captureVisibleTab(windowId, { format: "png" }, function(dataUrl) {
                    if (!dataUrl) return;

                    // Resize image because only need thumbnail size
                    sm.resizeImage(dataUrl, 192, 150, callback);
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
            if (!tabs.length) return;

            // Dehighlight all, only highlight the active one later
            actions.forEach(a => {
                a.highlighted = false;
            });

            var tab = tabs[0];
            if (isTabIgnored(tab) || isTabInComplete(tab)) return;

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
            dispatch.dataChanged(request.type);
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

                    var action = urlToActionLookup[tab.url];
                    if (action) {
                        action.endTime = new Date();
                        dispatch.dataChanged('endTime');
                    }
                });
            });
        }, 1000);
    }

    function createContextMenus() {
        // why remove all? todo
        chrome.contextMenus.removeAll();

        // To highlight selected text
        chrome.contextMenus.create( {
            id: 'sm-highlight',
            title: 'Highlight',
            contexts: ['selection']
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'sm-highlight') {
                chrome.tabs.sendMessage(tab.id, { type: 'highlightSelection' }, d => {
                    createNewAction(tab, 'highlight', d.text, urlToActionLookup[tab.url], d.path, d.classId);
                });
            }
        });
    }

    function buildLookups(callback) {
        // Build lookup using loaded actions
        var duplicateUrlTypes = [ 'highlight', 'note', 'revisit' ];
        urlToActionLookup = {};
        actions.forEach(action => {
            if (!duplicateUrlTypes.includes(action.type)) {
                urlToActionLookup[action.url] = action;
                action.closed = true;
            }
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
    module.capture = function() {
        listening = true;
        return this;
    };

    /**
     * Pauses capturing user actions.
     */
    module.pause = function() {
        listening = false;
        return this;
    };

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};