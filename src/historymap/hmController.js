const ignoredUrls = [
   'chrome-extension://',
   'edge://extensions/'
];

let displayTree = ()=>{};

function addPage(tabURL, docId, tabID, pageObj, parentPageId, isOpened=true) {
   if (!ignoredUrls.some(url => tabURL.includes(url))) {
      let newPageId = window.crypto.randomUUID();
      let newPage = new hmPage(
         newPageId,
         tabID,
         new Date(),
         pageObj,
         parentPageId,
         docId,
         isOpened
      );
      hmPages.push(newPage);
      console.log("A new hmPage added:", newPage.pageObj.title, ', ', newPage.pageObj.url);
      return newPageId;
   }
   return null;
}

function updatePage(pageId, type, data=null) {
   let page = hmPages.find(p => p.pageId === pageId);
   let parentPage = null;

   if (!page) {
      console.error('Page not found: ', pageId);
      return;
   }

   switch (type) {
      case 'complete': // update page object after navigation completed
         page.update({ pageObj: data.tab });
         break;
      case 'close': // page closed
         page.update({ isOpened: false });
         break;
      case 'beforeReopen': // before page reopened (from hm tree)
         page.update({ incomingTabId: data.tabId });
         break;
      case 'reopen': // page reopened (from hm tree)
         page.update({
            tabId: data.tab.id,
            docId: data.docId,
            time: new Date(),
            pageObj: data.tab,
            isOpened: true,
            incomingTabId: null
         });
         break;
      case 'reload': // rewrite page info, after reload or url change in empty page
         page.update({
            tabId: data.tab.id,
            docId: data.docId,
            time: new Date(),
            pageObj: data.tab,
            isOpened: true
         });
         break;
      case 'back': // go back
         page.update({ isOpened: false });
         page.increaseForwardBack('back');
         parentPage = getParentPage(page);
         parentPage.update({
            isOpened: true,
            docId: data.docId,
            time: new Date()
         });
         break;
      case 'forward': // go forward
         page.update({
            isOpened: true,
            docId: data.docId,
            time: new Date()
         });
         page.increaseForwardBack('forward');
         parentPage = getParentPage(page);
         parentPage.update({ isOpened: false });
         break;
      default:
         console.error('Unhandled type: ', type);
   }
}

function initializeHmPages() {
   // add all the tabs opened before running historymap to hmPages
   chrome.tabs.query({}, function (openedTabs) {
      console.log("Tabs opened before historymap: ", openedTabs);
      hmPages = []
      for (let i = 0; i < openedTabs.length; i++) {
         addPage(openedTabs[i].url, null, openedTabs[i].id, openedTabs[i], null);
      }
      displayTree(hmPages);
   });
}

function handleNavigationCommitted(details) {
   // Not respond to subframe events
   if (details.frameId !== 0) return;

   getTabInfo(details.tabId)
      .then(tab => mainHandler(details, tab))
      .catch(err => console.error(err));

   // Main handler
   function mainHandler(navInfo, tabInfo) {
      let pageEvent = navigationToPageEvent(navInfo, tabInfo);
      closePagesInTab(tabInfo.id);
      pageEventToHmPagesUpdate(pageEvent, navInfo, tabInfo);
      displayTree(hmPages);
   }
}

// Use history state update event to capture navigation from navigation bar
function handleHistoryStateUpdated(details) {
   // Not respond to subframe events
   if (details.frameId !== 0) return;

   // Only respond to active lifecycle
   if (details.documentLifecycle != 'active') return;
   
   // Deduplicate navigation commit events
   if (isPageCaptured(details)) return;

   getTabInfo(details.tabId)
      .then(tab => mainHandler(details, tab))

   function mainHandler(navInfo, tabInfo) {
      const event = historyStateUpdateToPageEvent(navInfo, tabInfo);

      // Set previous pages in tab as closed
      closePagesInTab(tabInfo.id);

      // Map event to hmPages update
      let pageId = pageEventToHmPagesUpdate(event, navInfo, tabInfo);
      displayTree(hmPages);

      // When history state updated, the tab content (e.g., the title) is not loaded
      // Manually capture this by polling the tab info
      captureTabUpdate(pageId);
   }

   function captureTabUpdate(pageId, duration=60000, interval=1000) {
      let page = hmPages.find(p => p.pageId === pageId);

      // Polling tab info
      let timer = setInterval(() => {
         getTabInfo(page.tabId)
            .then(tab => handleGetTabInfo(tab))
            .catch(() => clearInterval(timer));
      }, interval);

      // Remove timer if timeout
      setTimeout(() => {
         clearInterval(timer);
      }, duration);

      function handleGetTabInfo(tab) {
         if (
            // tab.url === page.pageObj.url
            isSameUrl(tab.url, page.pageObj.url) // Ignore query parameter changes
            && tab.title !== page.pageObj.title
         ) {
            updatePage(pageId, 'complete', { tab: tab});
            displayTree(hmPages);
            clearInterval(timer);
         }
      }
   }

   // To deduplicate events that are already captured by onCommitted api
   function isPageCaptured(navInfo) {
      let page = hmPages.find(p =>
         p.tabId === navInfo.tabId
         && p.isOpened
         // && p.pageObj.url === navInfo.url
         && isSameUrl(p.pageObj.url, navInfo.url) // Ignore query parameter changes
      );
      if (page) return true;
      return false;
   }

   // Compare pathname of two urls, ignore query parameters
   // !! This is a simplified version and does not work for all web apps
   // e.g.,
   //   'github.com/username/?tab=repositories'
   // will be treated as the same as
   //   'github.com/username/?tab=projects'
   function isSameUrl(url1, url2) {
      const parsedUrl1 = new URL(url1);
      const parsedUrl2 = new URL(url2);
      return parsedUrl1.pathname === parsedUrl2.pathname;
   }
}

function handleNavigationCompleted(details) {
   // Not respond to subframe events
   if (details.frameId !== 0) return;

   getTabInfo(details.tabId)
      .then(tab => mainHandler(tab))
      .catch(err => console.error(err));
   
   // Main handler
   function mainHandler(tabInfo) {
      let page = hmPages.find(p => p.docId === details.documentId);
      updatePage(page.pageId, 'complete', { tab: tabInfo })
      displayTree(hmPages);
   }
}

function handleTabRemoved(tabId) {
   closePagesInTab(tabId);
   displayTree(hmPages);
}

// register listeners
chrome.webNavigation.onHistoryStateUpdated.addListener(handleHistoryStateUpdated);
chrome.webNavigation.onCommitted.addListener(handleNavigationCommitted);
chrome.webNavigation.onCompleted.addListener(handleNavigationCompleted);
chrome.tabs.onRemoved.addListener(handleTabRemoved);

// When the window is open, the History Map is on
window.addEventListener("DOMContentLoaded", function () {
   toggle_badge("On");
   // Initialize hmPages
   initializeHmPages();
   var iframe = document.getElementById('tree_view');
   var iframeWindow = iframe.contentWindow;
   iframe.onload = function () {
      // Access global variables
      displayTree = iframeWindow.displayTree;
      displayTree(hmPages);
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
