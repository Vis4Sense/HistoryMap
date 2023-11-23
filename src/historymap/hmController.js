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

         let parentPageId = null;

         // if the tab is opened by another tab, the 'openerTabId' property will be set
         if (request.data.tab.openerTabId) {
            // Find the parent page
            const parentPage = hmPages.findLast((p) => 
               p.tabId === request.data.tab.openerTabId
            );
            if (parentPage) parentPageId = parentPage.pageId
            console.log("Opened by a page in a different tab: ", parentPageId);
            // The url changed in the same tab
         } else {
            const parentPage = hmPages.findLast((p) => 
               p.tabId === request.data.tabID
            );
            if (parentPage) parentPageId = parentPage.pageId
            console.log("Opened by a page in the same tab: ", parentPageId);
         }

         // Create a new hmPage object
         let newPage = new hmPage(
            newPageId,
            request.data.tabID,
            new Date(),
            request.data.tab,
            parentPageId
         );

         hmPages.push(newPage);
         console.log("A new hmPage added:", newPage);
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