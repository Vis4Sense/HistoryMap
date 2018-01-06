document.addEventListener('DOMContentLoaded', function () { 

	console.log("starting contextmenu.js " + new Date().getTime());
	
	//var urlToHighlight = contentScript.model.urlToHighlight;
	//alert("want to define model here " + new Date().getTime());
	chrome.runtime.sendMessage({type: 'contentScriptDefine'}, response => {
		console.log("sending script define message " + new Date().getTime());
		
		alert("sending script define message " + new Date().getTime());
		if (response){
			//alert("got contentScript definition here (not yet)");
		}
	});					
	createContextMenus();
	
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
				chrome.tabs.sendMessage(tab.id, { type: 'highlightSelection' }, response => {
					if (response) {
						console.log("reading response context menu " + new Date().getTime());
						if (!urlToHighlight[tab.url]) {
							urlToHighlight[tab.url] = []; 
						}
						//urlToHighlight[tab.url].push({type: 'highlight', path: d.path, text: d.text, classId: d.classId});
						urlToHighlight.addHighlight(url, {type: 'highlight', path: d.path, text: d.text, classId: d.classId});
					}
				});
			} else if (info.menuItemId === 'sm-save-image') {
				// Overwrite existing image
				chrome.tabs.sendMessage(tab.id, {type: 'highlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl}, response => {
					if (response) {
					}
					if (!urlToHighlight[tab.url]) {
						urlToHighlight[tab.url] = []; 
					}
					 //urlToHighlight[tab.url].push({type: 'highlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl});
					 urlToHighlight.addHighlight(url, {type: 'highlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl})
				});

				//To remove image (created once an image is saved)
				chrome.contextMenus.create({
					id: 'sm-remove-image',
					title: 'Remove Page Image',
					contexts: ['image']
				});
			} else if (info.menuItemId === 'sm-remove-image') {
				chrome.tabs.sendMessage(tab.id, {type: 'removeHighlightImage', srcUrl: info.srcUrl, pageUrl: info.pageUrl}, response => {
					if (response) {
					}
				});
			}
		});
	}
})
	