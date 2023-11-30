const ignoredUrls = [
   'chrome-extension://'
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
         console.log("page updated: ", request.data.changeInfo, ', tabId:', request.data.tabID, ', openerTabId: ', request.data.tab.openerTabId, ', data: ', request.data);

         // testing chrome history api
         chrome.history.search(
         {
            'text': '',                // Return every history item....
            // 'startTime': oneWeekAgo,   // that was accessed less than one week ago.
            'maxResults': 5            // Optionally state a limit
         },
         function (historyItems) {
            // For each history item, get details on all visits.
            // for (var i = 0; i < historyItems.length; ++i) {
            //    var url = historyItems[i].url;
            //    // do whatever you want with this visited url
               // console.log(`history item: ${i}, ${historyItems[i]}, transition type: ${historyItems[i].TransitionType}`);
            // }
            console.log('history items: ', historyItems);
         })

         let newPageId = window.crypto.randomUUID();

         let parentPageId = null;

         // if the tab is opened by another tab, the 'openerTabId' property will be set
         if (request.data.tab.openerTabId) {
            // Find the parent page
            const parentPage = hmPages.findLast((p) =>
               p.tabId === request.data.tab.openerTabId
            );
            if (parentPage) parentPageId = parentPage.pageId
            // console.log("Opened by a page in a different tab: ", parentPageId);
            // The url changed in the same tab
         } else {
            const parentPage = hmPages.findLast((p) =>
               p.tabId === request.data.tabID
            );
            if (parentPage) parentPageId = parentPage.pageId
            // console.log("Opened by a page in the same tab: ", parentPageId);
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
         // console.log("A new hmPage added:", newPage);
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