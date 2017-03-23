/**
 * captures user actions (provenance) in the Chrome browser.
 * part of the 'browser controller'.
 */
sm.provenance.browser = function() {
    const module = {};

    const ignoredUrls = [
        'chrome://',
        'chrome-extension://',
        'chrome-devtools://',
        'view-source:',
        'google.co.uk/url',
        'google.com/url',
        'localhost://'
    ],
        bookmarkTypes = [ 'auto_bookmark' ],
        typedTypes = [ 'typed', 'generated', 'keyword', 'keyword_generated' ];

    const urlToActionLookup = {}, // url -> action (data object) if the page was visited (first visit) and captured
        urlToParentIdLookup = {}; // url -> its parent ID

    let lastClickedUrl; // The URL of the page where the last link was clicked

    const dispatch = d3.dispatch('dataChanged');

    saveLastClickedUrl();
    detectPageLinking();
    captureTabInformation();

    function saveLastClickedUrl() {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.type === 'linkClicked') {
                lastClickedUrl = sender.tab.url;
            }
        });
    }

    function detectPageLinking() {
        // This detection method works based on the following assumption.
        // When a link is clicked, instantly the corresponding page will be opened and the tabUpdated code below will be invoked.
        // No other pages can be opened during this instant duration.
        // Therefore, the parent URL of that page is the URL of the page where the last link was clicked (lastClickedUrl).
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (!lastClickedUrl || urlToActionLookup[tab.url]) return;

            urlToParentIdLookup[tab.url] = urlToActionLookup[lastClickedUrl].id;

            // IMPORTANT: this URL should be reset after use so that the method can also work with manual address.
            delete lastClickedUrl;
        });
    }

    function captureTabInformation() {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            // Wait until the tab completes loading
            if (isTabIgnored(tab) || isTabInComplete(tab)) return;

            const action = urlToActionLookup[tab.url];

            // Do nothing if page is already captured
            if (action) return;

            getVisitType(tab.url, type => {
                // Still need to check the last time before creating a new action
                // because two updates can happen in a very short time,
                // thus the second one happens even before a new action is added in the first update.
                if (urlToActionLookup[tab.url]) return;

                const time = new Date(),
                    action = {
                        id: +time,
                        time: time,
                        url: tab.url,
                        text: tab.title || tab.url || '',
                        type: type,
                        favIconUrl: tab.favIconUrl
                    };

                // Set page linking information
                if (type === 'link' && urlToParentIdLookup[tab.url]) {
                    action.from = urlToParentIdLookup[tab.url];
                }

                urlToActionLookup[tab.url] = action;

                dispatch.dataChanged(action);
            });
        });
    }

    function isTabInComplete(tab) {
        return tab.status !== 'complete';
    }

    function isTabIgnored(tab) {
        return ignoredUrls.some(url => tab.url.includes(url));
    }

    function getVisitType(url, callback) {
        chrome.history.getVisits({ url: url }, results => {
            if (!results || !results.length) return;

            // The latest one contains information about the just completely loaded page
            const t = _.last(results).transition,
                type = bookmarkTypes.includes(t) ? 'bookmark' : typedTypes.includes(t) ? 'type' : 'link';

            callback(type);
        });
    }

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};