historyMap.controller.highlightNodes = function () {
	let nodes = historyMap.model.nodes;
	let htabs = historyMap.model.tabs;
	
	//to check if the highlight can be embedded in a historyMap node
	function isEmbeddedType(type) {
			return ['highlight', 'note', 'filter'].includes(type);
	}

	function createNewAction(tab, type, text, path, classId, pic) {
		var action;
		var tabsLatestNodeId = htabs.getId(tab.id);
		if (type === 'highlight') {
			action = createActionObject(tab.id, tab.url, text, type, undefined, path, classId, tabsLatestNodeId, undefined, false);
		} else if (type === 'save-image') {
			action = createActionObject(tab.id, tab.url, undefined, type, undefined, undefined, undefined, tabsLatestNodeId, pic, true);
			onImageSaved(tabsLatestNodeId, pic);
		} else if (type === 'remove-image') {
			onImageRemoved(tabsLatestNodeId, pic);
			//create a "remove image" action?
			//action = createActionObject(tab.id, tab.url, undefined, type, undefined, undefined, undefined, tab2nodeId[tab.id], pic, true);
		} else if (type === 'note') {
			action = createActionObject(tab.id, tab.url, text, "note", undefined, path, classId, tabsLatestNodeId, undefined, false);
		}
		return action;
	}

	var lastDate;

	//using old style of creating nodes(actions)
	function createActionObject(tabId, url, text, type, favIconUrl, path, classId, from, pic, hidden) {
		var time = new Date();
		var action = {
			id: uuidv4(),
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
			action.id = from;
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
		if (typeof from !== "undefined") {
			action.from = from;
		} else {
			if (tabId) {
				action.from = tab2nodeId[tabId];
			}
		}

		historyMap.model.nodes.addNode(action);
		return action;
	}
	
	//captures messages from background.js and contextMenu.js to update history map nodes with relevant node data
	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		if (request.type === 'highlight') {
			createNewAction(request.tab, 'highlight', request.text, request.path, request.classId);
		} else if (request.type === 'save-image') {
			createNewAction(request.tab, 'save-image', request.text, request.path, request.classId, request.picture);
		} else if (request.type === 'remove-image') {
			createNewAction(request.tab, 'remove-image', request.text, request.path, request.classId, request.picture);
		} else if (request.type === 'notedHistoryMap') {
			createNewAction(request.tab, 'note', request.data.text, request.data.path, request.classId, request.picture);
			historyMap.view.redraw();
		} else if (request.type === 'removeHighlightSelection') {
			historyMap.model.nodes.hideNode(request.tabUrl, request.classId);
			historyMap.view.redraw();
		}
	});
	
	//saves image in a historyMap node (or replaces an existing one)
	function onImageSaved(id, imageUrl) {
		var nodes = historyMap.model.nodes.getArray();
		var foundNode = nodes.find(a => a.id === id);
		if (foundNode) {
			foundNode.userImage = imageUrl;
			historyMap.view.redraw();
		}
	}
	
	//deletes the image from the historyMap node
	function onImageRemoved(id, imageUrl) {
		var nodes = historyMap.model.nodes.getArray();
		var foundNode = nodes.find(a => a.id === id && a.userImage === imageUrl);
		if (foundNode) {
			delete foundNode.userImage;
			historyMap.view.redraw();
		}
	}
}