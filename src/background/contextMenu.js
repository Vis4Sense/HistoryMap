document.addEventListener('DOMContentLoaded', function () { 		
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
			var modelInfo;
			if (info.menuItemId === 'sm-highlight') {
				chrome.tabs.sendMessage(tab.id, { type: 'highlightSelection' }, response => {
					if (response) {
						modelInfo = {innerType:'highlightSelection', tabUrl: tab.url, path:response.path, text: response.text, classId: response.classId};
						updateModel(modelInfo);
						chrome.runtime.sendMessage({tab: tab, type:'highlight', text: response.text, path:response.path, classId: response.classId, picture: null}, function (response) {
						});
					}
				});
			} else if (info.menuItemId === 'sm-save-image') {
				// Overwrite existing image
				chrome.tabs.sendMessage(tab.id, {type: 'highlightImage', tabUrl: tab.url, srcUrl: info.srcUrl, pageUrl: info.pageUrl}, response => {
					if (response) {
						modelInfo = {innerType:'highlightImage', tabUrl: tab.url, srcUrl: info.srcUrl, pageUrl: info.pageUrl};
						updateModel(modelInfo);
						chrome.runtime.sendMessage({tab: tab, type:'save-image', text:tab.title, path: null, classId: null, picture: info.srcUrl}, function (response) {
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
						modelInfo = {innerType:'removeHighlightImage', tabUrl: tab.url, srcUrl: info.srcUrl, pageUrl: info.pageUrl};
						updateModel(modelInfo);
						chrome.runtime.sendMessage({tab: tab, type:'remove-image', text:tab.title, path: null, classId: null, picture: info.srcUrl}, function (response) {
						});
					}
				});
			}
		});
	}
})
	