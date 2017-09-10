/**
 * captures user actions (provenance) in the Chrome browser.
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
//     if (title updated) send the new title to historyMapPage.js through an event;
//     if (favIconUrl updated) send the new favIconUrl to historyMapPage.js through an event;
// }

// function addNode(tab) {
//     create a new node with  the information from 'tab';
//     send the new 'node' to historyMapPage.js through an event;
// }

sm.provenance.browser = function() {
	const module = {};

	var nodeId = 0; // can't use tab.id as node id because new url can be opened in the existing tab
	var tab2node = {}; // the Id of the latest node for a given tab
	var tabUrl = {}; // the latest url of a given tabId
	var isTabCompleted = {}; // whether a tab completes loading (for redirection detection).

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

	const dispatch = d3.dispatch('nodeCreated','titleUpdated','favUpdated', 'typeUpdated','urlUpdated', 'nodeRemoved', 'imageSaved', 'imageRemoved');
	
	chrome.runtime.onMessage.addListener(onMessageReceived);

    onTabUpdate();
	onTabCreation();
	createContextMenus();

	function onTabCreation() {
		chrome.tabs.onCreated.addListener( function(tab) {

			// console.log('newTabEvent -', 'tabId:'+tab.id, ', parent:'+tab.openerTabId, ', url:'+tab.url); // for testing

			if(!isIgnoredTab(tab)) {
				console.log('newTab -', 'tabId:'+tab.id, ', parent:'+tab.openerTabId, ', url:'+tab.url, tab); // for testing

				// tab.title = 'id ' + tab.id + ' - ' + tab.title || tab.url;

				addNode(tab, tab.openerTabId);
				isTabCompleted[tab.id] = false;
			}
		});
	}

    function onTabUpdate() {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

			if(!isIgnoredTab(tab)) {
				// console.log('tabUpdate - ','tabid:'+tabId, ', parent:'+tab.openerTabId, ', title:'+tab.title, ' changeInfo:', changeInfo); // for testing

				console.log('tab update',tabId,changeInfo,tab);
				// console.log('isComplete',isTabCompleted[tabId],', tab2node',tab2node[tabId]);

				// 'changeInfo' information:
				// - status: 'loading': if (tabCompleted) {create a new node} else {update exisiting node}
				if (changeInfo.status == 'loading' && tab.url != tabUrl[tabId]) {
					// console.log('urlChange -','tabId:'+tabId, ', parent:'+tab.openerTabId,', url:'+tab.url,); // for testing

					if (tab2node[tabId] !== undefined && !isTabCompleted[tabId]) { // redirection
						const titleUpdate = {
							id: tab2node[tab.id],
							text: tab.title || tab.url
						};
						dispatch.titleUpdated(titleUpdate);

						const urlUpdate = {
							id: tab2node[tab.id],
							url: tab.url
						};
						dispatch.urlUpdated(urlUpdate);

						tabUrl[tabId] = tab.url;
					}
					else { // not redirection
						addNode(tab, tab.id);
					}
				}

				// - title: 'page title', {update node title}
				if (changeInfo.title) {

					const titleUpdate = {
						id: tab2node[tab.id],
						text: tab.title
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
				if (changeInfo.status == 'complete') {
					isTabCompleted[tabId] = true;
				}
			}
        });
    }

	function addNode(tab,parent) {

		// console.log('addding new node',tab,parent);

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

		dispatch.nodeCreated(node);

		nodeId++;

		// Update with visit type
		if (tab.url) {
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
		// else { // when the url is empty
		// 	console.warn('tab.url', tab.url);
		// }
	}

	function isEmbeddedType(type) {
        return [ 'highlight', 'note', 'filter' ].includes(type);
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
			if(tabId) {
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
	
	function createContextMenus() {
        chrome.contextMenus.removeAll();

        // To highlight selected text
        chrome.contextMenus.create({
            id: 'sm-highlight',
            title: 'Highlight',
            contexts: ['selection']
        });

        // To save image
        chrome.contextMenus.create({
            id: 'sm-save-image',
            title: 'Set as Page Image',
            contexts: ['image']
		});
		
        //function on contextMenuClicked
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'sm-highlight') {
                chrome.tabs.sendMessage(tab.id, { type: 'highlightSelection' }, d => {
                    if (d) {
						createNewAction(tab, 'highlight', d.text, d.path, d.classId);
					}
                });
            } else if (info.menuItemId === 'sm-save-image') {
                // Overwrite existing image
				chrome.tabs.sendMessage(tab.id, {type: 'highlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl}, d => {
					if (d) {
						createNewAction(tab, 'save-image', tab.title, undefined, undefined, info.srcUrl);
						dispatch.imageSaved(tab2node[tab.id], info.srcUrl);
					}
                });

				//To remove image (created once an image is saved)
				chrome.contextMenus.create({
					id: 'sm-remove-image',
					title: 'Remove Page Image',
					contexts: ['image']
        		});
			} else if (info.menuItemId === 'sm-remove-image') {
				chrome.tabs.sendMessage(tab.id, {type: 'removeHighlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl}, d=> {
					if (d) {
						dispatch.imageRemoved(tab2node[tab.id], info.srcUrl);
					}
				});
			}
        });
    }

	function onMessageReceived(request, sender, sendResponse) {
		if (request.type === 'highlightRemoved') {
            dispatch.nodeRemoved(request.classId, sender.tab.url);
	   }
	}
	
    d3.rebind(module, dispatch, 'on'); // what's this?
    return module;
};