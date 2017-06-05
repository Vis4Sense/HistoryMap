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

<<<<<<< HEAD
    let lastClickedUrl; // The URL of the page where the last link was clicked
    const dispatch = d3.dispatch('dataChanged');
    saveLastClickedUrl();
    captureTabInformation();
	onCreatedCall();

    function saveLastClickedUrl() {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			 if (request.loadURL) {
				//recordNodeLock[sender.tab.id] == 0;
				
/*				console.log("URL: "+sender.tab.url+" - Tab ID:"+sender.tab.id);
                   action = {
                        id: recordNodeID[sender.tab.id],
                        time: recordNodeTime[sender.tab.id],
                        url: sender.tab.url,
                        text: sender.tab.title || sender.tab.url || '',
                        type: "link",
				        favIconUrl: sender.tab.favIconUrl,
						counter: recordNodeCounter[sender.tab.id],
						from: recordNodeID[recordIDs[sender.tab.id]]
                    };
                dispatch.dataChanged(action); */
			 }
        });
		
		
    }

	function onCreatedCall() {
=======
    const dispatch = d3.dispatch('dataChanged');
    onTabUpdate();
	onTabCreation();

	function onTabCreation() {
>>>>>>> ff1124e5b6e44ec0fb173ff8f954f73b079ac22b
		chrome.tabs.onCreated.addListener( function( tab) {
		  if (tab.openerTabId && (tab.url.indexOf("chrome://newtab/") == -1)){
			var pid = tab.openerTabId;	
		  }  
		  if(pid) {
<<<<<<< HEAD
			console.log("A Edge is Created with the Parent ID:" + pid);
			recordIDs[tab.id] = pid;
			
		  } else {
				recordIDs[tab.id] = tab.id;
				console.log("A Node is Created with the Parent ID:" + tab.id);
				const time = new Date(),
					action = {
						id: +time,
						time: time,
						url: tab.url,
						text: tab.title || tab.url || '',
						type: "link",
						favIconUrl: tab.favIconUrl,
						counter: count,
						from: recordNodeID[recordIDs[tab.id]]
					};
					
				recordNodeID[tab.id] = +time;
				recordNodeTime[tab.id] = time;
				recordNodeCounter[tab.id] = count;
				recordNodeLock[tab.id] = 1;
				dispatch.dataChanged(action);
				count++;  
=======
			recordIDs[tab.id] = pid; // an edge 
		  } else {
			recordIDs[tab.id] = tab.id;
			addAction(tab,tab.id,0); // blank node gets created  - 0 is just written as null value 
>>>>>>> ff1124e5b6e44ec0fb173ff8f954f73b079ac22b
		  }
		});
	}

<<<<<<< HEAD
    function captureTabInformation() {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
			
            if (isTabIgnored(tab) || isTabInComplete(tab)) return;
			if(changeInfo.status === undefined || changeInfo.status === null) return;
			if(recordNodeLock[tabId] == 1) {  
					if(recordNodeHasChild[tabId] == 1) {  
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
							recordNodeHasChild[recordIDs[tabId]] = 1;
							dispatch.dataChanged(action);
							count++;
					} else {
							//update the node/edge
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
			
			} else {
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
				recordNodeHasChild[recordIDs[tabId]] = 1;
				//console.log("B"+recordNodeLock[tabId]);
				dispatch.dataChanged(action);
				count++;
			}
			
			
			
			
=======
    function onTabUpdate() {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
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
>>>>>>> ff1124e5b6e44ec0fb173ff8f954f73b079ac22b
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

    d3.rebind(module, dispatch, 'on');
    return module;
};