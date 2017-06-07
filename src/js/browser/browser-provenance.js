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
	
	// how to get an action back from the array?

	// can't use tab.id as node id because new url can be opened in the existing tab

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

    const dispatch = d3.dispatch('dataChanged');
    onTabUpdate();
	onTabCreation();

	function onTabCreation() {
		chrome.tabs.onCreated.addListener( function(tab) {

			console.log('new - ', 'tabId: '+tab.id, ', index: '+tab.index, ', parent: '+tab.openerTabId, ', title: '+tab.title, 'tab ', tab); // for testing

			tab.title = 'id ' + tab.id + ' - ' + tab.title;

			addNode(tab);

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

			console.log('update - ','tabid: '+tabId, ', index: '+tab.index, ', parent: '+tab.openerTabId, ', title: '+tab.title, ', changeInfo ', changeInfo, 'tab ', tab); // for testing

			tab.title = 'id: ' + tab.id + ' - ' + tab.title;

			// 'changeInfo' information:
			// - status: 'loading', if (completed before) {create a new node} else {do nothing}
			// - favIconUrl: url, {udpate node favIcon} or {do nothing}
			// - title: 'page title', {update node title} or {do nothing}
			// - status: 'complete', {set node status to complete} 

			/* Check for Finish Loading */
			if(!isFinishLoading(tab,changeInfo)) return;
			
			if(recordNodeLock[tabId] == 1) {  /* node is created and is waiting for information load to complete */
					if(recordNodeHasChild[tabId] == 1) {  
						addAction(tab,tabId,1);	
					} else {
						updateAction(tab,tabId); //update the node/edge
					}
			} else {
				addAction(tab,tabId,1); // when a link is added from an old tab this code runs 
			}
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
		dispatch.dataChanged(action);			
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
			
			dispatch.dataChanged(action);
			count++;  
		
	}

	function addNode(tab) {
		const time = new Date();
		const node = {
			tabId: tab.id,
			time: time,
			url: tab.url,
			text: tab.title || tab.url || '',
			type: "link", // what is this?
			favIconUrl: tab.favIconUrl,
			from: tab.openerTabId || ''
		};
		dispatch.dataChanged(node);
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