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
         chrome.history.getVisits(
            { url: request.data.tab.url },
            function (visitItems) {
               console.log('history entry: ', visitItems[0]);
               if (visitItems[0].transition === 'typed') {
                  isTyped = true;
               }

               let newPageId = window.crypto.randomUUID();

               let parentPageId = null;

               if (!isTyped) { // find the parent page if the url is not typed manually

                  // if the tab is opened by another tab, the 'openerTabId' property will be set
                  if (request.data.tab.openerTabId) {
                     // Find the parent page
                     const parentPage = hmPages.findLast((p) =>
                        p.tabId === request.data.tab.openerTabId
                     );
                     if (parentPage) parentPageId = parentPage.pageId
                     // console.log("Opened by a page in a different tab: ", parentPageId);

                  } else { // the tab is opened by the previous page in the same tab
                     const parentPage = hmPages.findLast((p) =>
                        p.tabId === request.data.tabID
                     );
                     if (parentPage) parentPageId = parentPage.pageId
                     // console.log("Opened by a page in the same tab: ", parentPageId);
                  }
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