/**
 * captures user actions (browser) in the Chrome browser.
 * part of the 'browser controller'.
 */

// Pseudo code
// function onTabCreation(newTab) {
//     addNode(newTab);
// }

// function onTabUpdate(tab) {
//     if ('loading') {
			// if (non-redireciton) addNode(tab);
			// else {update existing node}; // redirection
		// }
//     if (title updated) send the new title to historyMap.js through an event;
//     if (favIconUrl updated) send the new favIconUrl to historyMap.js through an event;
// }

// function addNode(tab) {
//     create a new node with  the information from 'tab';
//     send the new 'node' to historyMap.js through an event;
// }


historyMap.controller.browser = function() {
	// const module = {};

	var nodeId = 0; // can't use tab.id as node id because new url can be opened in the existing tab
	var tab2node = {}; // the Id of the latest node for a given tab
	var tabUrl = {}; // the latest url of a given tabId
	var isTabCompleted = {}; // whether a tab completes loading (for redirection detection).

	var nodes = historyMap.model.nodes;
	// var redraw = historyMap.view.redraw(); // why this doesn't work?

	// not recording any chrome-specific url
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

	chrome.tabs.onCreated.addListener( function(tab) {

		if(!isIgnoredTab(tab)) {
			console.log('newTab -', 'tabId:'+tab.id, ', parent:'+tab.openerTabId, ', url:'+tab.url, tab); // for testing

			addNode(tab, tab.openerTabId);
			isTabCompleted[tab.id] = false;
		}
	});


	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

		if(!isIgnoredTab(tab)) {

			console.log('tab update',tabId,changeInfo,tab);

			var node = nodes[tab2node[tab.id]];

			// 'changeInfo' information:
			// - status: 'loading': if (tabCompleted) {create a new node} else {update exisiting node}
			if (changeInfo.status == 'loading' && tab.url != tabUrl[tabId]) {

				if (tab2node[tabId] !== undefined && !isTabCompleted[tabId]) { // redirection
					node.text = tab.title || tab.url;
					node.url = tab.url;
					historyMap.view.redraw();

					tabUrl[tabId] = tab.url;
				}
				else { // not redirection
					addNode(tab, tab.id);
				}
			}

			// - title: 'page title', {update node title}
			if (changeInfo.title) {
				node.text = tab.title;
				historyMap.view.redraw();
			}

			// - favIconUrl: url, {udpate node favIcon}
			if (changeInfo.favIconUrl) {
				node.favIconUrl = tab.favIconUrl;
				historyMap.view.redraw();
			}

			// - status: 'complete', {do nothing}
			if (changeInfo.status == 'complete') {
				isTabCompleted[tabId] = true;
			}
		}
	});

	function addNode(tab,parent) {

		const title = tab.title || tab.url;
		const time = new Date();
		const node = {
			id: nodeId,
			tabId: tab.id,
			time: time,
			url: tab.url,
			text: title,
			favIconUrl: tab.favIconUrl,
			parentTabId:parent,
			from: tab2node[parent]
		};

		tab2node[tab.id] = nodeId;
		tabUrl[tab.id] = tab.url;
		isTabCompleted[tab.id] = false;

		nodeId = nodes.push(node);
		historyMap.view.redraw();

		console.log('added new node',node);

		// Update with visit type
		if (tab.url) {
			chrome.history.getVisits({ url: tab.url }, results => {
				// The latest one contains information about the just completely loaded page
				const type = results && results.length ? _.last(results).transition : undefined;

				nodes[tab2node[tab.id]].type = type;
			});
		}
	}

	/* Additional Functions for Checking */

	function isIgnoredTab(tab) {
		return ignoredUrls.some(url => tab.url.includes(url));
	}

}