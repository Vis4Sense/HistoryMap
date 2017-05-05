/**
 * captures user actions (provenance) in the Chrome browser.
 * part of the 'browser controller'.  */
sm.provenance.browser = function() {
	
	var count = 0;
    const module = {};
	var recordIDs = {};
	var recordNodeID = {};
	var recordNodeCounter = {};
	var recordNodeTime = {};
	var recordNodeLock = {};
	
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
		chrome.tabs.onCreated.addListener( function( tab) {
		  
		  if (tab.openerTabId && (tab.url.indexOf("chrome://newtab/") == -1)){
			var pid = tab.openerTabId;	
		  }  
		  if(pid) {
			console.log("An Edge is Created with the Tab ID:" + tab.id + " and Parent Id:"+ pid);
			recordIDs[tab.id] = pid;
		  } else {
			console.log("A Node is Created with the Parent ID:" + tab.id);
			recordIDs[tab.id] = tab.id;
		  }
		});
	}

    function captureTabInformation() {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
			
            if (isTabIgnored(tab) || isTabInComplete(tab)) return;
			if(changeInfo.status === undefined || changeInfo.status === null) return;
			if(recordNodeLock[tabId] == 1) {  
			
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
				console.log("B"+recordNodeLock[tabId]);
				dispatch.dataChanged(action);
				count++;
			}
			
			
			
			
        });
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