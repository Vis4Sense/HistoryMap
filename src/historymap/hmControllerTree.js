/**
 * handle events from the tree
 */

/**
 * if user clicks on a node on the tree, open the page
 * 
 * @param {hmPage} page - the page to open
 * 
 * call this function in your tree layout when a node is clicked
 */
function handleOpenPage(page) { // Yuhan: use a formal event as the parameter?
    const pageObj = page.pageObj;
    const url = pageObj.url;

    // find the tab with the page url
    // not using chrome.tabs.query({ url: url }) because it does not work when the url contains query parameters (?)
    chrome.tabs.query({}, function(tabs) {
        // find the tab with the page url
        const targetTabs = tabs.filter(tab =>
            tab.id === page.tabId
            && tab.url === url
        );

        if (targetTabs.length > 0) { // if tab found, go back to it
            activateTab(targetTabs[0]);
        } else { // if tab not found, create a new tab
            chrome.tabs.create({ url }, function(tab) {
                // update the page with the new tab
                updatePage(page.pageId, 'reopen', { tabId: tab.id, tab });
            });
        }
    });
}

function activateTab(tab) {
    const tabId = tab.id;
    const windowId = tab.windowId;

    chrome.windows.update(windowId, {focused: true}, function() {
        chrome.tabs.update(tabId, {active: true});
    });
}
