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


historyMap.controller.browser = function () {
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
		bookmarkTypes = ['auto_bookmark'],
		typedTypes = ['typed', 'generated', 'keyword', 'keyword_generated'];

	chrome.tabs.onCreated.addListener(function (tab) {

		if (!isIgnoredTab(tab)) {
			// console.log('newTab -', 'tabId:'+tab.id, ', parent:'+tab.openerTabId, ', url:'+tab.url, tab); // for testing

			addNode(tab, tab.openerTabId);
			isTabCompleted[tab.id] = false;
		}
	});


	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

		if (!isIgnoredTab(tab)) {

			// console.log('tab update',tabId,changeInfo,tab);

			var node = nodes.getNode(tab2node[tab.id]);

			// 'changeInfo' information:
			// - status: 'loading': if (tabCompleted) {create a new node} else {update exisiting node}
			if (changeInfo.status == 'loading' && tab.url != tabUrl[tabId]) {

				if (tab2node[tabId] !== undefined && !isTabCompleted[tabId]) { // redirection
					node.text = tab.title || tab.url;
					node.url = tab.url;
					historyMap.view.redraw();

					tabUrl[tabId] = tab.url;
				} else { // not redirection
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
				if (loggedIn = true) {
					Node2DB();
				}
			}
		}
	});

	function addNode(tab, parent) {

		const title = tab.title || tab.url;
		const time = new Date();
		// const node = {
		// 	id: nodeId,
		// 	tabId: tab.id,
		// 	time: time,
		// 	url: tab.url,
		// 	text: title,
		// 	favIconUrl: tab.favIconUrl,
		// 	parentTabId:parent,
		// 	from: tab2node[parent]
		// };
		const node = new Node(nodeId, tab.id, time, tab.url, title, tab.favIconUrl, parent, tab2node[parent]);

		tab2node[tab.id] = nodeId;
		tabUrl[tab.id] = tab.url;
		isTabCompleted[tab.id] = false;

		if (recording == true) {
			nodeId = nodes.addNode(node);
		}

		// Update with visit type
		if (tab.url) {
			chrome.history.getVisits({
				url: tab.url
			}, results => {
				// The latest one contains information about the just completely loaded page
				const type = results && results.length ? _.last(results).transition : undefined;

				nodes.getNode(tab2node[tab.id]).type = type;
			});
		}
	}

	/* Additional Functions for Checking */

	function isIgnoredTab(tab) {
		return ignoredUrls.some(url => tab.url.includes(url));
	}

	function isEmbeddedType(type) {
		return ['highlight', 'note', 'filter'].includes(type);
	}

	function createNewAction(tab, type, text, path, classId, pic) {
		// Still need to check the last time before creating a new action
		// because two updates can happen in a very short time, thus the second one
		// happens even before a new action is added in the first update
		var action;
		if (type === 'highlight') {
			action = createActionObject(tab.id, tab.url, text, type, undefined, path, classId, tab2node[tab.id], undefined, false);
		} else if (type === 'save-image') {
			action = createActionObject(tab.id, tab.url, undefined, type, undefined, undefined, undefined, tab2node[tab.id], pic, true);
		}
		return action;
	}

	var lastDate;

	//using old style of creating nodes(actions)
	function createActionObject(tabId, url, text, type, favIconUrl, path, classId, from, pic, hidden) {
		var time = new Date(),
			action = {
				id: nodeId,
				time: time,
				url: url,
				text: text,
				type: type,
				showImage: true,
				hidden: hidden
			};

		if (favIconUrl) action.favIconUrl = favIconUrl;
		if (path) action.path = path;
		if (classId) action.classId = classId;

		if (pic) {
			action.value = pic;
			action.id = tab2node[tabId];
		}
		if (!isEmbeddedType(type)) {
			// End time
			action.endTime = action.id + 1;
		} else {
			action.embedded = true;
		}

		if (lastDate && action.id === +lastDate) action.id += 1;
		lastDate = time;

		// Referrer
		//cant use if(action.from) because action.from = node.id,
		//which has range of 0 to n  
		if (typeof from !== "undefined") {
			action.from = from;
		} else {
			if (tabId) {
				action.from = tab2node[tabId];
			}
		}

		dispatch.nodeCreated(action);
		nodeId++;
		return action;
	}

	/* Additional Functions for Checking */

	function isIgnoredTab(tab) {
		return ignoredUrls.some(url => tab.url.includes(url));
	}


	function onMessageReceived(request, sender, sendResponse) {
		if (request.type === 'highlightRemoved') {
			dispatch.nodeRemoved(request.classId, sender.tab.url);
		} else if (request.type === 'noted') {
			const typeUpdate = {
				classId: request.data.classId,
				text: request.data.text,
				type: 'note',
				url: sender.tab.url
			};
			dispatch.typeUpdated(typeUpdate);
		} else if (request.type === 'loadHighlights') {
			//will not be called yet....
			// Get highlights, notes for the requested item
			var tab = sender.tab;
			//var highlightObject = checkIfUrlContainsHighlights(tab.url);
			sendResponse(highlightObject);
		}
	}



}