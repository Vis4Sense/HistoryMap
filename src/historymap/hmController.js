const ignoredUrls = [
   'chrome-extension://',
   'edge://extensions/'
];

let displayTree = ()=>{};

function addPage(tabURL, tabID, pageObj, parentPageId, isOpened=true) {
   if (!ignoredUrls.some(url => tabURL.includes(url))) {
      let newPageId = window.crypto.randomUUID();
      let newPage = new hmPage(
         newPageId,
         tabID,
         new Date(),
         pageObj,
         parentPageId,
         isOpened
      );
      hmPages.push(newPage);
      console.log("A new hmPage added:", newPage.pageObj.title, ', ', newPage.pageObj.url);
      // displayTree(hmPages);
   }
}

function updatePage(pageId, type, data=null) {
   let page = hmPages.find(p => p.pageId === pageId);
   
   if (!page) {
      console.error('Page not found: ', pageId);
      return;
   }

   if (type === 'reopen') { // if page reopened (from hm tree)
      page.tabId = data.tabId;
      page.time = new Date();
      page.pageObj = data.tab;
      page.isOpened = true;
      console.log("Page reopened: ", page.pageObj.title, ', ', page.pageObj.url);
   } else if (type === 'close') { // if page closed
      page.isOpened = false;
      console.log("Page closed: ", page.pageObj.title, ', ', page.pageObj.url);
   } else if (type === 'back') {
      page.forwardBack.back++;
      page.isOpened = false;
      let parentPage = hmPages.find(p => p.pageId === page.parentPageId);
      parentPage.isOpened = true;
      parentPage.time = new Date();
      console.log("Page goes back: ", page.pageObj.title, ', ', page.pageObj.url);
   } else if (type === 'forward') {
      page.forwardBack.forward++;
      page.isOpened = true;
      page.time = new Date();
      let parentPage = hmPages.find(p => p.pageId === page.parentPageId);
      parentPage.isOpened = false;
      console.log("Page goes forward: ", page.pageObj.title, ', ', page.pageObj.url);
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
               if (lastHistoryEntry && lastHistoryEntry.transition && lastHistoryEntry.transition === 'typed') {
                  isTyped = true;
                  console.log('Typed url: ', request.data.tab.url);
               }

               // let newPageId = window.crypto.randomUUID();

               let parentPageId = null;
               let parentPage = null;

               if (!isTyped) { // find the parent page if the url is not typed manually

                  sortedHmPages = [...hmPages].sort((a, b) => a.time - b.time); // sort by time

                  // Find the parent page
                  // check if the tab is opened by a previous page in the same tab
                  parentPage = sortedHmPages.findLast((p) =>
                     p.tabId === request.data.tabID
                  );
                  if (parentPage) { // if there was a page in the same tab
                     parentPageId = parentPage.pageId;
                     if (parentPage.pageObj.url === request.data.tab.url) { // if the url is the same, this is not a new page so just update pageObj
                        parentPage.pageObj = request.data.tab;
                        isNewPage = false;
                     }
                     // console.log("Opened by a page in the same tab: ", parentPageId);
                  }
                  else { // not typed and not page in the same tab ==> opened by another tab
                     parentPage = sortedHmPages.findLast((p) =>
                        p.tabId === request.data.tab.openerTabId
                     );
                     if (parentPage) {
                        parentPageId = parentPage.pageId
                     }
                     // console.log("Opened by a page in a different tab: ", parentPageId);
                     // !! we will be in trouble if we can't find the tab with the 'openerTabId'.
                  }
               }

               // Not add the page if it is opened by going back
               if (isNewPage && parentPage && parentPage.tabId === request.data.tabID) {
                  // If the page is the same as the parent of its parent: go back
                  let parentPage = hmPages.find(p => p.pageId === parentPageId);
                  if (parentPage && parentPage.parentPageId) {
                     let grandParentPage = hmPages.find(p => p.pageId === parentPage.parentPageId);
                     if (
                        grandParentPage
                        && grandParentPage.tabId === request.data.tabID
                        && grandParentPage.pageObj.url === request.data.tab.url
                     ) {
                        updatePage(parentPageId, 'back');
                        isNewPage = false;
                     }
                  }
               }
               
               // Not add the page if it is opened by going forward
               if (isNewPage && parentPage && parentPage.tabId === request.data.tabID) {
                  // if the page is the same as its siblings: go forward
                  let siblings = hmPages.filter(p => p.parentPageId === parentPageId);
                  if (siblings) {
                     let sameSibling = siblings.find(p => 
                        p.tabId === request.data.tabID
                        && p.pageObj.url === request.data.tab.url
                     );
                     if (sameSibling) {
                        updatePage(sameSibling.pageId, 'forward');
                        isNewPage = false;
                     }
                  }
               }

               // Not add the page if it is opened from hm tree
               if (isNewPage) {
                  // Check if the page is already in hmPages
                  let oldPage = hmPages.find(p => 
                     p.tabId === request.data.tabID
                     && (
                        p.pageObj.url === request.data.tab.url
                        || p.pageObj.pendingUrl === request.data.tab.url
                     )
                     && p.isOpened
                  );

                  if (oldPage) {
                     oldPage.pageObj = request.data.tab;
                     isNewPage = false;
                  }
               }

               if (isNewPage) {
                  // Set other pages in the same tab to be closed
                  let oldPages = hmPages.filter(p => p.tabId === request.data.tabID);
                  oldPages.forEach(p => {
                     updatePage(p.pageId, 'close');
                  });
                  // Create a new hmPage object
                  addPage(request.data.tab.url, request.data.tabID, request.data.tab, parentPageId);
               }

               // Map page data to tree data
               // displayTree(hmPages);
               // displayTree2(hmPages);
               displayTree(hmPages);
            }
         );
      }
   })

// listen to tab close event
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
   let page = hmPages.find(p => 
      p.tabId === tabId
      && p.isOpened
   );
   if (page) {
      updatePage(page.pageId, 'close');
      displayTree(hmPages);
   } else {
      console.error('Page not found: ', tabId);
   }
});


// When the window is open, the History Map is on
window.addEventListener("DOMContentLoaded", function () {
   toggle_badge("On");
   var iframe = document.getElementById('tree_view');
   var iframeWindow = iframe.contentWindow;
   iframe.onload = function () {
      // Access global variables
      displayTree = iframeWindow.displayTree;
      displayTree(hmPages)
   }
});

window.addEventListener("beforeunload", function () {
   toggle_badge("Off");
});


async function toggle_badge(state) {
   chrome.action.setBadgeText({
      text: state,
   });
}