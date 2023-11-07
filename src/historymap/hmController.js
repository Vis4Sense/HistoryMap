chrome.runtime.onMessage.addListener(
   function (request, sender, sendResponse) {

      // There are a few update events when a new page is loaded. changeInfo.status === 'complete' is when the page loading finishes.
      if ( // Protect against errors in form. 
        request.data &&
        request.data.changeInfo &&
        request.data.changeInfo.status === "complete"
      ) {
        // debug
        console.log("page updated: ", request.data);

        let newPageId = window.crypto.randomUUID();

        // check if a page opened in this tab before
        let parentTab = hmTabs.find((t) => t.tabId === request.data.tabID);
        let parentTabId;

        // create a hmTab object if this is a new tab
        if (!parentTab) {
          let newTab = new hmTab(request.data.tabID, newPageId);
          hmTabs.push(newTab);

          // if the tab is opened by another tab, the 'openerTabId' property will be set
          let parentTabId = request.data.tab.openerTabId;
          if (parentTabId) {
            parentTabId = hmTabs.find(
              (t) => t.tabId === parentTabId
            ).lastPageId;
          } else {
            parentTabId = null;
          }
        } else {
          parentPageId = parentTab.lastPageId;
        }

        // Create a new hmPage object
        let newPage = new hmPage(
          newPageId,
          request.data.tabID,
          new Date(),
          request.data.tab,
          parentTabId
        );

        hmPages.push(newPage);

        // Map page data to tree data
        displayTree(hmPages);
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