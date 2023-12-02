const ignoredUrls = [
   'chrome-extension://',
   'edge://extensions/'
];

function isIgnoredTab(tab) {
   return ignoredUrls.some(url => tab.url.includes(url));
}

chrome.runtime.onMessage.addListener(
   function (request, sender, sendResponse) {

      // When changeInfo.url
      if (
         request.data
         && request.data.changeInfo
         && request.data.changeInfo.title
         && !isIgnoredTab(request.data.tab)
      ) {
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
               }

               let newPageId = window.crypto.randomUUID();

               let parentPageId = null;

               if (!isTyped) { // find the parent page if the url is not typed manually

                  // Find the parent page
                  // check if the tab is opened by a previous page in the same tab
                  let parentPage = hmPages.findLast((p) =>
                     p.tabId === request.data.tabID
                  );
                  if (parentPage) { // if there was a page in the same tab
                     if (parentPage.pageObj.url === request.data.tab.url) { // if the url is the same, this is not a new page so just update the title
                        parentPage.pageObj.title = request.data.tab.title;
                        isNewPage = false;
                     }
                     else {
                        parentPageId = parentPage.pageId
                     }
                     // console.log("Opened by a page in the same tab: ", parentPageId);
                  }
                  else {
                     parentPage = hmPages.findLast((p) =>
                        p.tabId === request.data.tab.openerTabId
                     );
                     parentPageId = parentPage.pageId
                     // console.log("Opened by a page in a different tab: ", parentPageId);
                     // !! we will be in trouble if we can't find the tab with the 'openerTabId'.
                  }
               }

               if (isNewPage) {
                  // Create a new hmPage object
                  let newPage = new hmPage(
                     newPageId,
                     request.data.tabID,
                     new Date(),
                     request.data.tab,
                     parentPageId
                  );

                  hmPages.push(newPage);
                  console.log("A new hmPage added:", newPage.pageObj.title, ', ', newPage.pageObj.url);
               }

               // Map page data to tree data
               displayTree(hmPages);
               // displayTree2(hmPages);
            }
         );


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