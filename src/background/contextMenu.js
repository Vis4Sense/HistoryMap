document.addEventListener('DOMContentLoaded', function () { 
	console.log("starting contextmenu.js " + new Date().getTime());			
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
						console.log("the response is " + JSON.stringify(response));
						chrome.tabs.sendMessage(tab.id, {type: 'updateModel', innerType:'highlightSelection', tabUrl: tab.url, path:response.path, text: response.text, classId: response.classId}, response2 => {
							if (response2){
								console.log("model has been updated with text");
							}
						});
					}
				});
			} else if (info.menuItemId === 'sm-save-image') {
				// Overwrite existing image
				chrome.tabs.sendMessage(tab.id, {type: 'highlightImage', tabUrl: tab.url, srcUrl: info.srcUrl, pageUrl: info.pageUrl}, response => {
					if (response) {
						console.log("the response is " + response);
						chrome.tabs.sendMessage(tab.id, {type: 'updateModel', innerType:'highlightImage', tabUrl: tab.url, srcUrl: info.srcUrl, pageUrl: info.pageUrl}, response2 => {
							if (response2){
								console.log("model has been updated with image addition");
							}
						});
					}
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
						console.log("the response is " + response);
						chrome.tabs.sendMessage(tab.id, {type: 'updateModel', innerType:'removeHighlightImage', tabUrl: tab.url, srcUrl: info.srcUrl, pageUrl: info.pageUrl}, response2 => {
							if (response2){
								console.log("model has been updated with image removal");
							}
						});
					}
				});
			}
		});
	}
})
	