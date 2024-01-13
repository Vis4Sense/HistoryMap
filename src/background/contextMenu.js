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
        chrome.contextMenus.removeAll();

        // To highlight selected text
        chrome.contextMenus.create({
            id: "hm-highlight",
            title: "Highlight",
            contexts: ["selection"],
        });

        // Register listener for context menu click
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            // console.log("info", info);
            // console.log("tab", tab);

            // Handle highlight selected text
            if (info.menuItemId === "hm-highlight") {
                chrome.tabs.sendMessage(tab.id, { type: "highlightSelection" }, (response) => {
                    if (response) {
                        // const modelInfo = {
                        //     innerType: "highlightSelection",
                        //     tabUrl: tab.url,
                        //     path: response.path,
                        //     text: response.text,
                        //     classId: response.classId,
                        // };
                        // updateModel(modelInfo);
                        chrome.runtime.sendMessage(
                            {
                                tab: tab,
                                type: "highlightHistoryMap",
                                text: response.text,
                                path: response.path,
                                classId: response.classId,
                                picture: null,
                            }
                        );
                    }
                });
            }
        });
    }
});
