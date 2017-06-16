/**
 * captures user actions (provenance) in the Chrome browser.
 * part of the 'browser controller'.
 */

// Pseudo code
// function onTabCreation(newTab) {
//     addNode(newTab);
// }

// function onTabUpdate(tab) {
//     if (url changed) addNode(tab);
//     if (title updated) send the new title to history-map-page.js through an event;
//     if (favIconUrl updated) send the new favIconUrl to history-map-page.js through an event;
// }

// function addNode(tab) {
//     create a new node with  the information from 'tab';
//     send the new 'node' to history-map-page.js through an event;
// }

sm.provenance.browser = function() {
	const module = {};

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

    const dispatch = d3.dispatch('nodeCreated','titleUpdated','favUpdated', 'typeUpdated');

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

				// 'changeInfo' information:
				// - status: 'loading', if (url changed) {create a new node} else {do nothing}
				if (changeInfo.status == 'loading' && tab.url != tabUrl[tab.id]) {

					console.log('urlChange -','tabId:'+tabId, ', parent:'+tab.openerTabId,', url:'+tab.url,); // for testing

					addNode(tab, tab.id); //if there is already a node for this tab
				}

				// - title: 'page title', {update node title}
				if (changeInfo.title) {

					const titleUpdate = {
						id: tab2node[tab.id],
						text: tab.id + ':' + tab.title
					};

					dispatch.titleUpdated(titleUpdate);
				}

				// - favIconUrl: url, {udpate node favIcon}
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
		const title = tab.title || tab.url;
		const time = new Date();
		const node = {
			id: nodeIndex,
			tabId: tab.id,
			time: time,
			url: tab.url,
			text: tab.id + ':' + tab.title,
			favIconUrl: tab.favIconUrl,
			parentTabId:parent,
			from: tab2node[parent]
		};

		tab2node[tab.id] = nodeIndex;
		tabUrl[tab.id] = tab.url;

		dispatch.nodeCreated(node);

		nodeIndex++;

		// Update with visit type
		chrome.history.getVisits({ url: tab.url }, results => {
			// The latest one contains information about the just completely loaded page
			const type = results && results.length ? _.last(results).transition : undefined;

            const typeUpdate = {
				id: tab2node[tab.id],
				type: type
			};

			dispatch.typeUpdated(typeUpdate);
        });
	}

	/* Additional Functions for Checking */

    function isTabIgnored(tab) {
        return ignoredUrls.some(url => tab.url.includes(url));
    }

    d3.rebind(module, dispatch, 'on'); // what's this?
    return module;
};