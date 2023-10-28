/**
 * captures user actions (browser) in the Chrome browser.
 * part of the 'browser controller'.
 */

// Outline pseudo code
// function onTabCreation(newTab) {
//     addNode(newTab);
// }

// function onTabUpdate(tab) {
//     if ('loading') {
// 			if (non-redireciton) addNode(tab);
// 			else {update existing node}; // redirection
// 	   }
//     if (title updated) send the new title to historyMap.js through an event;
//     if (favIconUrl updated) send the new favIconUrl to historyMap.js through an event;
// }

// function addNode(tab) {
//     create a new node with  the information from 'tab';
//     send the new 'node' to historyMap.js through an event;
// }

historyMap.controller.browser = function () {

	let hmNodes = historyMap.model.nodes;
	let hmTabs = historyMap.model.tabs;

	// not recording any chrome-specific url
	const ignoredUrls = [
		'chrome://',
		'chrome-extension://',
		'chrome-devtools://',
		'view-source:',
		'google.co.uk/url',
		'google.com/url',
		'localhost://'
	];
	//used for closed tabs withIgnoredUrls (onRemoved)
	ignoredTabsIdToUrl = {};

	chrome.tabs.onCreated.addListener(function (tab) {

		// this does not catch the event of manually created tab?

		if (!isIgnoredTab(tab)) {
			// console.log('newTab -', 'tabId:' + tab.id, ', parent:' + tab.openerTabId, ', url:' + tab.url, tab);
			let historyMapNodes = hmNodes.getArray().filter(n => (n.url == tab.url));
			let clickedNodes = historyMapNodes.filter(n => ((n.clicked == true) && (n.tabStatus == "closed")));
			//annotation (highlight) nodes
			let highlightNodes = historyMapNodes.filter(n => (n.embedded != undefined));
			let clickedHighlightNodes = highlightNodes.filter(n => (n.clicked == true));

			//if an annotation(highlight) node was clicked
			if (clickedHighlightNodes.length > 0) {
				let parentNode = clickedHighlightNodes[0].parent;
				//if the Tab which contains the annotation is open
				if (hmTabs.getTab(parentNode.tabId)) {
					//dont add a duplicate Tab to hmTabs
				} else {
					//add a Tab using the node representing the webpage
					hmTabs.addTab(new Tab(tab.id, parentNode, false));
				}
				//if a normal historyMap node was clicked
			} else if (clickedNodes.length > 0) {
				//adds a stub Tab(with preused node), for onUpdated to process it correctly
				hmTabs.addTab(new Tab(tab.id, clickedNodes[0], false));
			} else {
				//no nodes clicked, tab created using other means
				let newNode = addNode(tab, findParentNodeId(tab));
				hmTabs.addTab(new Tab(tab.id, newNode, false));
			}
		} else {
			ignoredTabsIdToUrl[tab.id] = tab.url;
		}
	});

	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

		if (!isIgnoredTab(tab)) {

			// console.log('tab update',tabId,changeInfo,tab);

			let samURLNodes = hmNodes.getArray().filter(n => (n.url == tab.url));
			let clickedNodes = samURLNodes.filter(n => ((n.clicked == true) && (n.tabStatus == "closed")));
			//annotation (highlight) nodes
			let highlightNodes = samURLNodes.filter(n => (n.embedded != undefined));
			let clickedHighlightNodes = highlightNodes.filter(n => (n.clicked == true));
			let clickedNode = false;

			if (clickedHighlightNodes.length > 0) {
				clickedNode = true;
				let parentNode = clickedHighlightNodes[0].parent
			} else if (clickedNodes.length > 0) {
				//Tab is closed, node was clicked, do not add Tab
				// if a tab is opened before historyMap and then refreshed
			} else if (!hmTabs.getTab(tab.id)) {
				let newNode = addNode(tab, findParentNodeId(tab));
				hmTabs.addTab(new Tab(tab.id, newNode, false));
			}

			let hmTab;
			//if an annotation node was clicked
			if (clickedNode) {
				//use annotation parent node tabId
				let parentNode = clickedHighlightNodes[0].parent;
				hmTab = hmTabs.getTab(parentNode.tabId);
			} else {
				hmTab = hmTabs.getTab(tab.id);
			}
			let node = hmTab.node;

			// 'changeInfo' information:
			// - status: 'loading': if (tabCompleted) {create a new node} else {update existing node}
			if (changeInfo.status == 'loading' && tab.url != node.url) {

				if (node !== undefined && !hmTab.isCompleted) { // redirection
					node.text = tab.title || tab.url;
					node.url = tab.url;
					historyMap.view.redraw();
				} else { // not redirection
					hmTab.node = addNode(tab, node.id);
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
        hmTab.isCompleted = true;

        // Enqueue a node change, we need to flatten the source and links due to
        // circular dependencies. This is reconstructed from IDs when loading
        // the session.
        Messaging.send('persistor', { action: 'queue', node: {
          ...node,
          source: undefined,
          links: undefined,
          children: undefined,
          parent: undefined
        }})
			}
		} else {
			ignoredTabsIdToUrl[tab.id] = tab.url;
		}
	});

	chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
		//given tabId find the node, set its "tabOpen" status to closed
		if (!ignoredTabsIdToUrl[tabId]) {
			let closedTabId = hmTabs.getId(tabId);
			hmNodes.setNodeTabStatus(closedTabId, "closed");
		} else {
			//an ignored tab is being closed
			delete ignoredTabsIdToUrl[tabId];
		}
	});

	function addNode(tab, parentNodeId) {

		const node = new Node(
			uuidv4(), // nodeId
			tab.id,
			new Date(),
			tab.url,
			tab.title || tab.url,
			tab.favIconUrl,
			parentNodeId,
			"opened"
		);

		hmNodes.addNode(node);

		// Update with visit 'type' (the 'type' information is used in the historyMapView)
		if (tab.url) {
			chrome.history.getVisits({
				url: tab.url
			}, results => {
				// The latest one contains information about the just completely loaded page
				const type = results && results.length ? _.last(results).transition : undefined; // the 'transition' is a field of the chrome 'VisitItem' object(https://developer.chrome.com/extensions/history#type-VisitItem) and has these possible values (https://developer.chrome.com/extensions/history#type-TransitionType)

				node.type = type;
			});
		}

		historyMap.view.redraw();

		return node;
	}

	function findParentNodeId(tab) {
		let parentNodeId = null;
		if (tab.openerTabId && hmTabs.getTab(tab.openerTabId)) {
			parentNodeId = hmTabs.getTab(tab.openerTabId).node.id;
		}
		return parentNodeId;
	}

	/* Additional Functions for Checking */

	function isIgnoredTab(tab) {
		return ignoredUrls.some(url => tab.url.includes(url));
	}
}
