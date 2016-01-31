/**
 * browser captures user actions in the Chrome browser.
 */
sm.provenance.browser = function() {
    var module = {};

    var actions, // The input/output array of actions
        listening,
        urlToActionLookup = {}; // url -> true if the page was visited and captured

    var dispatch = d3.dispatch('dataChanged');

    chrome.tabs.onUpdated.addListener(onTabUpdated);
    chrome.tabs.onActivated.addListener(onTabActivated);
    chrome.tabs.onRemoved.addListener(onTabRemoved);
    chrome.runtime.onMessage.addListener(onMessageReceived);

    // Couldn't distinguish between auto reload and normal first load.
    // I don't want to include auto reload page. So, don't capture revisit here at all.
    // If the user opens a revisit page, accept a known bug that it's not captured.
    function onTabUpdated(tabId, changeInfo, tab) {
        if (!listening || isTabIgnored(tab) || !isTabComplete(tab)) return;

        var action = urlToActionLookup[tab.url];
        if (action) {
            // After a tab is complete, 'favIconUrl' can still be updated.
            if (!action.favIconUrl) {
                console.log('update after new: ' + tab.url);
                updateAction(tab);
            }
        } else {
            addAction(tab);
        }
    }

    function isTabComplete(tab) {
        return tab.status === 'complete';
    }

    function isTabIgnored(tab) {
        var ignoredUrls = [ "chrome://", "chrome-extension://", "chrome-devtools://", "view-source:", "google.co.uk/url", "google.com/url", "localhost://" ];
        return ignoredUrls.some(url => tab.url.includes(url));
    }

    function addAction(tab) {
        getVisitType(tab.url, type => {
            createNewAction(tab, type);
        });
    }

    function addRevisitAction(tab) {
        createNewAction(tab, 'revisit');
    }

    function getVisitType(url, callback) {
        chrome.history.getVisits({ url: url }, results => {
            if (!results || !results.length) return;

            // The latest one contains information about the just completely loaded page
            var visitTransition = results[0].transition,
                bookmarkTypes = [ "auto_bookmark" ],
                typedTypes = [ "typed", "generated", "keyword", "keyword_generated" ],
                type = bookmarkTypes.includes(visitTransition) ? 'bookmark' :
                    typedTypes.includes(visitTransition) ? 'type' : 'link';

            callback(type);
        });
    }

    function createNewAction(tab, type) {
        // Still need to check the last time before creating a new action
        // because two updates can happen in a very short time, thus the second one
        // happens even before a new action is added in the first update
        if (type === 'revisit') {
            var originalAction = urlToActionLookup[tab.url];
            console.log('create revisit: ' + tab.url);
            var time = new Date(),
                action = {
                    id: +time,
                    time: time,
                    url: originalAction.url,
                    text: originalAction.text,
                    type: type,
                    favIconUrl: originalAction.favIconUrl,
                    from: originalAction.id
                };

            actions.push(action);
            dispatch.dataChanged();
        } else {
            if (urlToActionLookup[tab.url]) {
                console.log('update in new: ' + tab.url);
                updateAction(tab);
            } else {
                console.log('create new: ' + tab.url);
                var time = new Date(),
                    action = {
                    id: +time,
                    time: time,
                    url: tab.url,
                    text: tab.title || tab.url || '',
                    type: type,
                    favIconUrl: tab.favIconUrl,
                    seen: tab.active
                };

                actions.push(action);
                urlToActionLookup[tab.url] = action; // Maintain the first visit
                dispatch.dataChanged();
            }
        }
    }

    function updateAction(tab) {
        var action = urlToActionLookup[tab.url];
        if (tab.active) action.seen = true;

        // The only practical update I've seen!
        if (tab.favIconUrl && tab.favIconUrl !== action.favIconUrl) {
            action.favIconUrl = tab.favIconUrl;
            dispatch.dataChanged();
        }
    }

    function onTabActivated(activeInfo) {
        if (!listening) return;

        chrome.tabs.query({ windowId: activeInfo.windowId, active: true }, function(tabs) {
            if (!tabs.length) return;

            var tab = tabs[0];
            if (isTabIgnored(tab) || !isTabComplete(tab)) return;

            var action = urlToActionLookup[tab.url];
            if (action) {
                // If this is the first time the tab is activated (can be a result of 'open in new tab')
                // set it's seen, otherwise, this is a revisit.
                if (action.seen) {
                    addRevisitAction(tab);
                } else {
                    action.seen = true;
                }
            } else {
                addAction(tab);
            }
        });
    }

    function onTabRemoved(tabId, removeInfo) {

    }

    function onMessageReceived(request, sender, sendResponse) {

    }

    /**
     * Sets/gets the capturing actions.
     */
    module.actions = function(value) {
        if (!arguments.length) return actions;
        actions = value;
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