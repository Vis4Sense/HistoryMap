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

	let nodes = historyMap.model.nodes;
	let htabs = historyMap.model.tabs;

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

	chrome.tabs.onCreated.addListener(function (tab) {

		// this does not catch the event of manually created tab?

		if (!isIgnoredTab(tab)) {
			console.log('newTab -', 'tabId:' + tab.id, ', parent:' + tab.openerTabId, ', url:' + tab.url, tab); // for testing
			//web page history map nodes
			let historyMapNodes = nodes.getArray().filter(n => (n.url == tab.url));
			let clickedNodes = historyMapNodes.filter(n => ((n.clicked == true) && (n.tabStatus == "closed")));
			//annotation (highlight) nodes
			let highlightNodes = historyMapNodes.filter(n => (n.embedded != undefined));
			let clickedHighlightNodes = highlightNodes.filter(n => (n.clicked == true));

			if (clickedHighlightNodes.length > 0) {
				let parentNode = clickedHighlightNodes[0].parent
				//"created, clickedHighlight"
				if (htabs.getTab(parentNode.tabId)) {
					//"created, dont add tabnode"
				} else {
					//"created, add tabnode(parent)""
					//add another tab using the node representing the webpage (non annotation node)
					htabs.addTab(new Tab(tab.id, parentNode, false));
				}
			} else if (clickedNodes.length > 0) {
				//"created, clicked and closed is > 0, so add fake node"
				//adds node element to Tab, for on updated to process it
				htabs.addTab(new Tab(tab.id, clickedNodes[0], false));
			} else {
				//"created, add node bevcause clicked and closed < 1"
				let newNode = addNode(tab, findParentNodeId(tab));
				htabs.addTab(new Tab(tab.id, newNode, false));
			}
		}
	});

	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

		if (!isIgnoredTab(tab)) {

			// console.log('tab update',tabId,changeInfo,tab);

			// if a tab is opened before historyMap and then refreshed
			let historyMapNodes = nodes.getArray().filter(n => (n.url == tab.url));
			//at least one node which shares url with recently opened tab
			let clickedNodes = historyMapNodes.filter(n => (n.clicked == true));

			//embedded (annotation) history map nodes			
			let highlightNodes = historyMapNodes.filter(n => (n.embedded != undefined));
			//clicked embedded nodes
			let clickedHighlightNodes = highlightNodes.filter(n => (n.clicked == true));
			let clickedNode = false;

			if (clickedHighlightNodes.length > 0) {
				clickedNode = true;
				let parentNode = clickedHighlightNodes[0].parent
				/*if (htabs.getTab(parentNode.tabId)) {
					console.log("updated, dont add tabnode");
					//do not add another tab
				} else {
					console.log(" updated, add tabnode(parent)");
				}*/
			} else if (clickedNodes.length > 0) {
				//"clicked and closed is > 0, so do not add node"
			} else if (!htabs.getTab(tab.id)) {
				// add node
				let newNode = addNode(tab, findParentNodeId(tab));
				htabs.addTab(new Tab(tab.id, newNode, false));
			}

			let htab;
			//if an annotation node was clicked 
			if (clickedNode) {
				//use annotation nodes parent node tabId
				let parentNode = clickedHighlightNodes[0].parent;
				htab = htabs.getTab(parentNode.tabId);
			} else {
				htab = htabs.getTab(tab.id);
			}
			let node = htab.node;
			
			// 'changeInfo' information:
			// - status: 'loading': if (tabCompleted) {create a new node} else {update existing node}
			if (changeInfo.status == 'loading' && tab.url != node.url) {

				if (node !== undefined && !htab.isCompleted) { // redirection
					node.text = tab.title || tab.url;
					node.url = tab.url;
					historyMap.view.redraw();
				} else { // not redirection
					htab.node = addNode(tab, node.id);
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
				htab.isCompleted = true;
				if (loggedIn === true) {
					historyMap.database.user.Node2DB();
				}
			}
		}
	});

	chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
		//given tabId find the node, set its "tabOpen" status to closed
		console.log("closing tab", tabId);
		let closedTabId = htabs.getId(tabId);
		console.log("closedTabId ", closedTabId);
		nodes.setNodeTabStatus(closedTabId, "closed");
		nodes.getArray().forEach(node => {
			//mainting a tabStatus for embedded (annotation) nodes is unnecessary 
			/*if (node.children){
				node.children.forEach(childNode => {
					nodes.setNodeTabStatus(childNode.id, "closed");
				});
			}*/
		});
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
			true,
			"opened"
		);

		nodes.addNode(node);

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
		if (tab.openerTabId && htabs.getTab(tab.openerTabId)) {
			parentNodeId = htabs.getTab(tab.openerTabId).node.id;
		}
		return parentNodeId;
	}

	/* Additional Functions for Checking */

	function isIgnoredTab(tab) {
		return ignoredUrls.some(url => tab.url.includes(url));
	}
}