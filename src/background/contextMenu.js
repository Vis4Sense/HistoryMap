/**
 * @file contextMenu.js
 * @description Creates context menus
 * @see {@link https://developer.chrome.com/docs/extensions/reference/api/contextMenus}
 */

console.log("contextMenu.js");

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	// if loading completed, add context menus
	if (changeInfo.status === "complete" && tab.status === "complete") {
		createContextMenus();
	}

	// create context menus
	function createContextMenus() {
      chrome.contextMenus.removeAll(); // remove all context menus

      // define menu items
      const menuItems = [
         { id: "hm-highlight-text", title: "Highlight Text", contexts: ["selection"] }, // to highlight text
         { id: "hm-save-image", title: "Save Image", contexts: ["image"] }, // to save image
      ];

      // create context menus
      menuItems.forEach((menuItem) => {
         chrome.contextMenus.create(menuItem);
      });

      
		// Register listener for context menu click
		chrome.contextMenus.onClicked.addListener((info, tab) => {
         // Yuhan: I don't know why click a the context menu will trigger this listener twice, and even more after clicking several times?

			if (info.menuItemId === "hm-highlight-text") { // highlight selected text
            handleHighlightSelection(tab);
			} else if (info.menuItemId === "hm-save-image") { // highlight image
            handleHighlightImage(info, tab)
         }
		});
	}

   // handle highlight selected text
   function handleHighlightSelection(tab) {
      chrome.tabs.sendMessage(
         tab.id,
         { type: "highlightSelection" },
         (response) => {
            if (!response) return;
            chrome.runtime.sendMessage({
               tab: tab,
               type: "hmHighlightText",
               text: response.text,
               path: response.path,
               classId: response.classId,
               picture: null,
            });
         }
      );
   }

   // handle highlight image
   function handleHighlightImage(info, tab) {
      chrome.tabs.sendMessage(
         tab.id,
         {
            type: "highlightImage",
            tabUrl: tab.url,
            srcUrl: info.srcUrl,
            pageUrl: info.pageUrl,
         },
         (response) => {
            if (!response) return;
            chrome.runtime.sendMessage({
               tab: tab,
               type: "hmHighlightImage",
               imageSrcUrl: info.srcUrl,
               imageBase64: response.imageBase64,
               imageWidth: response.imageWidth,
               imageHeight: response.imageHeight,
            });
         }
      )
   }
});
