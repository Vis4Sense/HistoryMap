/**
 * captures user actions (provenance) in the Chrome browser.
 * part of the 'browser controller'.
 */
sm.provenance.browser = function() {
	
	var count = 0;
    const module = {};
	var recordIDs = {};
	var recordNodeID = {};
	var recordNodeCounter = {};
	var recordNodeTime = {};
	var recordNodeLock = {};
	var recordNodeHasChild = {};

	// can't use tab.id as node id because new url can be opened in the existing tab
	var nodeIndex = 0;
	var tab2node = {}; // stores the Id of the latest node for a given tab
	var tabUrl = {}; // stores the latest url of a given tabId

    // this is the not needed initially
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

    const dispatch = d3.dispatch('nodeCreated','nodeUpdated');

    onTabUpdate();
	onTabCreation();

	function onTabCreation() {
		chrome.tabs.onCreated.addListener( function(tab) {

			if(!isTabIgnored(tab)) {
				console.log('newTabEvent -', 'tabId:'+tab.id, ', parent:'+tab.openerTabId, ', title:'+tab.title); // for testing

				tab.title = 'id ' + tab.id + ' - ' + tab.title;

				// find the nodeId of the parent tab
				var parent = '';
				if (tab.openerTabId) {
					parent = tab2node[tab.openerTabId];
				}
				
				addNode(tab, parent);
			}

			// if (tab.openerTabId && (tab.url.indexOf("chrome://newtab/") == -1)){
			// var pid = tab.openerTabId;	
			// }  
			// if(pid) {
			// recordIDs[tab.id] = pid; // an edge 
			// } else {
			// recordIDs[tab.id] = tab.id;
			// addAction(tab,tab.id,0); // blank node gets created  - 0 is just written as null value 
			// }
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

					if (tab2node[tab.id]) {
						addNode(tab, tab2node[tab.id]); //if there is already a node for this tab
					}
					else {
						addNode(tab, tab2node[tab.openerTabId]); // when opening a link in a new tab, there is no tabCreation event, only tabUpdate event. 
					}
				}

				// - favIconUrl: url, {udpate node favIcon}
				// - title: 'page title', {update node title}
				if (changeInfo.favIconUrl || changeInfo.title) {

					// if (changeInfo.title) {
					// 	console.log('updateTabEvent - ','tabid:'+tabId, ', newTitle:'+tab.title,); // for testing
					// }

					updateNode(tab);
				}

				// - status: 'complete', {do nothing}
			}

			/* Check for Finish Loading */
			// if(!isFinishLoading(tab,changeInfo)) return;
			
			// if(recordNodeLock[tabId] == 1) {  /* node is created and is waiting for information load to complete */
			// 		if(recordNodeHasChild[tabId] == 1) {  
			// 			addAction(tab,tabId,1);	
			// 		} else {
			// 			updateAction(tab,tabId); //update the node/edge
			// 		}
			// } else {
			// 	addAction(tab,tabId,1); // when a link is added from an old tab this code runs 
			// }
        });
    }
	
	function updateAction(tab,tabId) {
		action = {
			id: recordNodeID[tabId],
			time: recordNodeTime[tabId],
			url: tab.url,
			text: tab.title || tab.url || '',
			type: "link",
			favIconUrl: tab.favIconUrl,
			counter: recordNodeCounter[tabId],
			from: recordNodeID[recordIDs[tabId]]
		};
		dispatch.nodeCreated(action);			
		recordNodeLock[tabId] = 0; 
		return ; 
	}
	
	function addAction(tab,tabId,hasChild) {
			
			const time = new Date(),
			action = {
				id: +time,
				time: time,
				url: tab.url,
				text: tab.title || tab.url || '',
				type: "link",
				favIconUrl: tab.favIconUrl,
				counter: count,
				from: recordNodeID[recordIDs[tabId]]
			};
			recordNodeID[tabId] = +time;
			recordNodeTime[tabId] = time;
			recordNodeCounter[tabId] = count;
			recordNodeLock[tabId] = 1;
			
			
			if(hasChild == 1) {
				recordNodeHasChild[recordIDs[tabId]] = 1;
			}
			
			dispatch.nodeCreated(action);
			count++;  
		
	}

	function addNode(tab,parent) {

		const time = new Date();
		const node = {
			id: nodeIndex,
			tabId: tab.id,
			time: time,
			url: tab.url,
			text: tab.title || tab.url || '',
			type: "link", // there are different edge types (manual url, open a link, etc.). Only 'link' in the simplified version
			favIconUrl: tab.favIconUrl,
			from: parent
		};

		tab2node[tab.id] = nodeIndex;
		tabUrl[tab.id] = tab.url;

		dispatch.nodeCreated(node);

		nodeIndex++;
	}

	function updateNode(tab) {
		
		// actions[nodeId].url = url;
		// actions[nodeId].title = title;
		// actions[nodeId].favIconUrl = favIconUrl;

		// const time = new Date();

		const nodeUpdate = {
			id: tab2node[tab.id],
			// time: time,
			url: tab.url,
			text: tab.title || tab.url || '',
			favIconUrl: tab.favIconUrl
		};

		dispatch.nodeUpdated(nodeUpdate);
	}


	/* Additional Functions for Checking */
	
	function isFinishLoading(tab,changeInfo) {
        if (isTabIgnored(tab) || isTabInComplete(tab)) return false;
		if(changeInfo.status === undefined || changeInfo.status === null) return false;
		return true;
	}
	
    function isTabInComplete(tab) {
        return tab.status !== 'complete';
    }

    function isTabIgnored(tab) {
        return ignoredUrls.some(url => tab.url.includes(url));
    }

    d3.rebind(module, dispatch, 'on'); // what's this?
    return module;
};