/**
 * captures user actions (provenance) in the Chrome browser.
 * part of the 'browser controller'.
 */
sm.provenance.browser = function() {

	// can't use tab.id as node id because new url can be opened in the existing tab
	var nodeIndex = 0;
	var tab2node = {}; // stores the Id of the latest node for a given tab
	var tabUrl = {}; // stores the latest url of a given tabId

    // not recording any chrome-specific url
	const ignoredUrls = [
        'chrome://',
        'chrome-extension://',
        'chrome-devtools://',
        'view-source:',
        // 'google.co.uk/url',
        // 'google.com/url',
        'localhost://'
    ],
    bookmarkTypes = [ 'auto_bookmark' ],
    typedTypes = [ 'typed', 'generated', 'keyword', 'keyword_generated' ];

    const dispatch = d3.dispatch('nodeCreated','titleUpdated','favUpdated');

    onTabUpdate();
	onTabCreation();

	function onTabCreation() {
		chrome.tabs.onCreated.addListener( function(tab) {

			// console.log('newTabEvent -', 'tabId:'+tab.id, ', parent:'+tab.openerTabId, ', url:'+tab.url); // for testing

			if(!isTabIgnored(tab)) {
				console.log('newTabEvent -', 'tabId:'+tab.id, ', parent:'+tab.openerTabId, ', url:'+tab.url); // for testing

				// tab.title = 'id ' + tab.id + ' - ' + tab.title || tab.url;
				
				addNode(tab, tab.openerTabId);
			}
		});
	}

    function onTabUpdate() {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

			if(!isTabIgnored(tab)) {
				// console.log('updateTabEvent - ','tabid:'+tabId, ', parent:'+tab.openerTabId, ', title:'+tab.title,); // for testing

				tab.title = 'tid:' + tab.id + ' - ' + tab.title;

				// 'changeInfo' information:
				// - status: 'loading', if (url changed) {create a new node} else {do nothing}
				if (changeInfo.status == 'loading' && tab.url != tabUrl[tab.id]) {

					console.log('updateTabEvent -','tabId:'+tabId, ', parent:'+tab.openerTabId,', url:'+tab.url,); // for testing

					// if (tab2node[tab.id]) {
						addNode(tab, tab.id); //if there is already a node for this tab
					// }
					// else {
					// 	addNode(tab, tab2node[tab.openerTabId]); // when opening a link in a new tab, there is no tabCreation event, only tabUpdate event. 
					// }
				}

				// - favIconUrl: url, {udpate node favIcon}
				// - title: 'page title', {update node title}
				if (changeInfo.title) {

					// if (changeInfo.title) {
					// 	console.log('updateTabEvent - ','tabid:'+tabId, ', newTitle:'+tab.title,); // for testing
					// }

					const titleUpdate = {
						id: tab2node[tab.id],
						text: tab.id + tab.title,
					};

					dispatch.titleUpdated(titleUpdate);
				}

				if (changeInfo.favIconUrl) {
					const favUpdate = {
						id: tab2node[tab.id],
						favUrl: tab.favIconUrl,
					};

					dispatch.favUpdated(favUpdate);
				}

				// - status: 'complete', {do nothing}
			}
        });
    }

	function addNode(tab,parent) {

		const time = new Date();
		const node = {
			id: nodeIndex,
			tabId: tab.id,
			time: time,
			url: tab.url,
			text: tabId + ' ' + tab.title || tab.url,
			type: "link", // there are different edge types (manual url, open a link, etc.). Only 'link' in the simplified version
			favIconUrl: tab.favIconUrl,
			parentTabId:parent,
			from: tab2node[parent]
		};

		tab2node[tab.id] = nodeIndex;
		tabUrl[tab.id] = tab.url;

		dispatch.nodeCreated(node);

		nodeIndex++;
	}


	/* Additional Functions for Checking */

    function isTabIgnored(tab) {
        return ignoredUrls.some(url => tab.url.includes(url));
    }

    d3.rebind(module, dispatch, 'on'); // what's this?
    return module;
};