const ignoredUrls = [
   'chrome-extension://',
   'edge://extensions/'
];

function addPage(tabURL, tabID, pageObj, parentPageId) {
   if (!ignoredUrls.some(url => tabURL.includes(url))) {
      let newPageId = window.crypto.randomUUID();
      let newPage = new hmPage(
         newPageId,
         tabID,
         new Date(),
         pageObj,
         parentPageId
      );
      hmPages.push(newPage);
      console.log("A new hmPage added:", newPage.pageObj.title, ', ', newPage.pageObj.url);
      // displayTree(hmPages);
   }
}


chrome.runtime.onMessage.addListener(
   function (request, sender, sendResponse) {

      if (request.type === 'tabUpdated') {
         console.log("A new page update event: ", request.data);
      }

      // add all the tabs opened before running historymap to hmPages
      if (hmPages && hmPages.length === 0) {
         chrome.tabs.query({}, function (openedTabs) {
            console.log("Tabs opened before historymap: ", openedTabs);
            hmPages = []
            for (let i = 0; i < openedTabs.length; i++) {
               addPage(openedTabs[i].url, openedTabs[i].id, openedTabs[i], null);
            }
            displayTree(hmPages);
         });
      }

      // When changeInfo.url
      if (
         request.data
         && request.data.changeInfo
         // && request.data.changeInfo.title
      ) {
         // Ignore messages from ignored URLs
         if (request.data && request.data.tab && request.data.tab.url && ignoredUrls.some(url => request.data.tab.url.includes(url))) return
         // debug
         console.log("tab updated: ", request.data.changeInfo, ', url: ', request.data.tab.url, ', tabId:', request.data.tabID, ', openerTabId: ', request.data.tab.openerTabId, ', data: ', request.data);

         // check if the url is typed manually using chrome history api's getVisits function
         let isTyped = false;
         let isNewPage = true;
         chrome.history.getVisits(
            { url: request.data.tab.url },
            function (visitItems) {
               let lastHistoryEntry = visitItems[visitItems.length - 1];
               // console.log('history entry: ', lastHistoryEntry);
               if (lastHistoryEntry.transition && lastHistoryEntry.transition === 'typed') {
                  isTyped = true;
                  console.log('Typed url: ', request.data.tab.url);
               }

               // let newPageId = window.crypto.randomUUID();

               let parentPageId = null;

               if (!isTyped) { // find the parent page if the url is not typed manually

                  // Find the parent page
                  // check if the tab is opened by a previous page in the same tab
                  let parentPage = hmPages.findLast((p) =>
                     p.tabId === request.data.tabID
                  );
                  if (parentPage) { // if there was a page in the same tab
                     if (parentPage.pageObj.url === request.data.tab.url) { // if the url is the same, this is not a new page so just update pageObj
                        parentPage.pageObj = request.data.tab;
                        isNewPage = false;
                     }
                     else {
                        parentPageId = parentPage.pageId
                     }
                     // console.log("Opened by a page in the same tab: ", parentPageId);
                  }
                  else { // not typed and not page in the same tab ==> opened by another tab
                     parentPage = hmPages.findLast((p) =>
                        p.tabId === request.data.tab.openerTabId
                     );
                     if (parentPage) {
                        parentPageId = parentPage.pageId
                     }
                     // console.log("Opened by a page in a different tab: ", parentPageId);
                     // !! we will be in trouble if we can't find the tab with the 'openerTabId'.
                  }
               }

               if (isNewPage) {
                  // Create a new hmPage object
                  addPage(request.data.tab.url, request.data.tabID, request.data.tab, parentPageId);
               }

               // Map page data to tree data
               displayTree(hmPages);
               // displayTree2(hmPages);
            }
         );
      }
   })


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