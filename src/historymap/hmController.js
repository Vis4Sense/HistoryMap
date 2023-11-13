chrome.runtime.onMessage.addListener(
   function (request, sender, sendResponse) {
 
      // When changeInfo.url
      if (
        request.data &&
        request.data.changeInfo &&
        request.data.changeInfo.url
      ) {
        // debug
        console.log("page updated URL: ", request.data);

        let newPageId = window.crypto.randomUUID();

        // if the tab is opened by another tab, the 'openerTabId' property will be set
        let parentTabId = request.data.tab.openerTabId;
        if (parentTabId && request.data.tabID != parentTabId) {
          // Find the parent page
          const page = hmPages.findLast((p) => p.tabId == parentTabId);
          parentPageId = page ? page.pageId : null;
          console.log("parentTabId: ", parentTabId);
          // The url changed in the same tab
        } else {
          const page = hmPages.findLast((p) => p.tabId == request.data.tabID);
          parentPageId = page ? page.pageId : null;
          console.log("parentPageId: ", request.data.tabID);
        }
        // } else {
        //   parentPageId = parentTab.lastPageId;
        // }

        // Create a new hmPage object
        let newPage = new hmPage(
          newPageId,
          request.data.tabID,
          new Date(),
          request.data.tab,
          parentPageId
        );

        hmPages.push(newPage);
        console.log("hmPages:", hmPages)
        // Map page data to tree data
        displayTree(hmPages);
        // displayTree2(hmPages);
      }
   }
);


// When the window is open, the History Map is open
window.addEventListener("DOMContentLoaded", function () {
  toggle_badge("Open");
});

window.addEventListener("beforeunload", function () {
  toggle_badge("Off");
});


async function toggle_badge(state) {
  chrome.action.setBadgeText({
    text: state,
  });
}