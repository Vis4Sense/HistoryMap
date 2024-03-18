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
      // displayTree(hmPages);
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
      case 'beforeReopen': // before page reopened (from hm tree)
         page.incomingTabId = data.tabId;
         break;
      case 'reopen': // page reopened (from hm tree)
         page.tabId = page.incomingTabId;
         page.docId = data.docId;
         page.incomingTabId = null;
         page.time = new Date();
         page.pageObj = data.tab;
         page.isOpened = true;
         console.log("Page reopened: ", page.pageObj.title, ', ', page.pageObj.url);
         break;
      case 'reload': // rewrite page info, after reload or url change in empty page
         page.tabId = data.tab.id;
         page.docId = data.docId;
         page.time = new Date();
         page.pageObj = data.tab;
         page.isOpened = true;
         console.log("Page rewritten: ", page.pageObj.title, ', ', page.pageObj.url);
         break;
      case 'complete': // update page object after navigation completed
         page.pageObj = data.tab;
         break;
      case 'close': // page closed
         page.isOpened = false;
         console.log("Page closed: ", page.pageObj.title, ', ', page.pageObj.url);
         break;
      case 'back': // go back
         page.forwardBack.back++;
         page.isOpened = false;
         parentPage = getParentPage(page);
         parentPage.isOpened = true;
         parentPage.docId = data.docId;
         parentPage.time = new Date();
         console.log("Page goes back: ", page.pageObj.title, ', ', page.pageObj.url);
         break;
      case 'forward': // go forward
         page.forwardBack.forward++;
         page.isOpened = true;
         page.docId = data.docId;
         page.time = new Date();
         parentPage = getParentPage(page);
         parentPage.isOpened = false;
         console.log("Page goes forward: ", page.pageObj.title, ', ', page.pageObj.url);
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
   // console.log('Navigation committed: ', details);

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

   // Map navigation info to page event
   function navigationToPageEvent(navInfo, tabInfo) {
      // console.log('Navigation info: ', navInfo);
      // console.log('Tab info: ', tabInfo);

      let event = '';

      const { transitionType, transitionQualifiers } = navInfo;
      const { openerTabId } = tabInfo;

      const isNewTab = isTabFirstOpened(tabInfo);
      const hasOpener = openerTabId !== undefined;
      const isReopened = isOpenedByHistoryMap(tabInfo);
      const isFromHistory = isOpenedByHistoryPage(tabInfo);
      const isForwardBack = transitionQualifiers.includes('forward_back');
      const isFromAddressBar = transitionQualifiers.includes('from_address_bar');
      const isFromEmpty = isFromEmptyPage(tabInfo);

      switch (true) {
         // create a new tab
         case isNewTab && transitionType === 'auto_bookmark':
            event = 'tabCreate-bookmark';
            break;
         case isNewTab && transitionType === 'start_page':
            event = 'tabCreate-startPage';
            break;
         case isNewTab && transitionType === 'typed':
            event = 'tabCreate-newtab'; // !! we have not dealt with new tab in Edge
            break;
         case isNewTab && transitionType === 'reload' && !hasOpener:
            event = 'tabCreate-historyRecent';
            break;
         case isNewTab && transitionType === 'reload' && hasOpener:
            event = 'tabCreate-duplicate';
            break;
         case isNewTab && transitionType === 'link' && isReopened:
            event = 'tabCreate-hmReopen';
            break;
         case isNewTab && transitionType === 'link' && !isReopened && !hasOpener:
            event = 'tabCreate-webPopup';
            break;
         case isNewTab && transitionType === 'link' && !isReopened && hasOpener && isFromHistory:
            event = 'tabCreate-historyPage';
            break;
         case isNewTab && transitionType === 'link' && !isReopened && hasOpener && !isFromHistory:
            event = 'tabCreate-clickLink';
            break;

         // existing tab url changes
         case !isNewTab && isForwardBack:
            event = 'tabUpdate-forwardBack';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'reload':
            event = 'tabUpdate-reload';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'link':
            event = 'tabUpdate-clickLink';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'form_submit':
            event = 'tabUpdate-formSubmit';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'auto_bookmark' && isFromEmpty:
            event = 'tabUpdate-bookmarkEmpty';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'auto_bookmark' && !isFromEmpty:
            event = 'tabUpdate-bookmark';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'typed' && isFromEmpty:
            event = 'tabUpdate-typedEmpty';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'typed' && !isFromEmpty:
            event = 'tabUpdate-typed';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'generated' && isFromAddressBar && isFromEmpty:
            event = 'tabUpdate-searchEmpty';
            break;
         case !isNewTab && !isForwardBack && transitionType === 'generated' && isFromAddressBar && !isFromEmpty:
            event = 'tabUpdate-search';
            break;
         default:
            event = 'tabCreate-clickLink';
            console.error('unhandled event: ', navInfo);
      }

      console.log('Event: ', event);

      return event;
   }

   function isTabFirstOpened(tabInfo) {
      let page = hmPages.find(p => p.tabId === tabInfo.id);
      if (!page) return true;
      return false;
   }

   function isOpenedByHistoryMap(tabInfo) {
      let page = hmPages.find(p => p.incomingTabId === tabInfo.id);
      if (page) return true;
      return false;
   }

   function isOpenedByHistoryPage(tabInfo) {
      if (!tabInfo.openerTabId) return false;
      let openerPage = hmPages.find(p => p.tabId === tabInfo.openerTabId);
      if (!openerPage) return false;
      if (openerPage.url === 'chrome://history/') return true;
      return false;
   }

   function isFromEmptyPage(tabInfo) {
      let lastPage = lastPageInTab(tabInfo.id);
      if (!lastPage) return false;
      if (isEmptyPage(lastPage)) return true;
      return false;
   }

   function isEmptyPage(page) {
      if (page.pageObj.url === 'chrome://newtab/' || page.pageObj.url === 'edge://newtab/') return true;
      return false;
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

   console.log('History state updated: ', details);

   getTabInfo(details.tabId)
      .then(tab => mainHandler(details, tab))

   function mainHandler(navInfo, tabInfo) {
      // Map history state update to page event
      let event = '';

      switch (true) {
         case navInfo.transitionQualifiers.includes('forward_back'):
            event = 'tabUpdate-forwardBack';
            break;
         case navInfo.transitionQualifiers.includes('client_redirect'):
            event = 'tabUpdate-clientRedirect';
            break;
         default:
            event = 'tabUpdate-clickLink';
      }

      console.log('Event: ', event);

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

// Map page event to hmPages update
function pageEventToHmPagesUpdate(event, navInfo, tabInfo) {
   let openerPage = null;
   let parentPage = null;
   let page = null;
   let pageId = null;

   switch (event) {
      // add a new node, not link to existing node
      case 'tabCreate-bookmark':
      case 'tabCreate-startPage':
      case 'tabCreate-newtab':
      case 'tabCreate-historyRecent':
      case 'tabUpdate-bookmark':
      case 'tabUpdate-typed':
      case 'tabUpdate-search':
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, null);
         break;

      // add a new node, link to an existing node
      case 'tabCreate-duplicate':
         // sibling of the opener page
         openerPage = lastPageInTab(tabInfo.openerTabId);
         parentPage = getParentPage(openerPage);
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage ? parentPage.pageId : null);
         break;
      case 'tabCreate-webPopup':
         // link to the opener page
         // !! we don't know which page opens this, temporarily using the last opened page
         parentPage = openerPage = lastOpenedPage();
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage.pageId);
         break;
      case 'tabCreate-historyPage':
      case 'tabCreate-clickLink':
         // link to the last page in the opener tab
         parentPage = openerPage = lastPageInTab(tabInfo.openerTabId);
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage.pageId);
         break;
      case 'tabUpdate-clickLink':
      case 'tabUpdate-formSubmit':
         // link to the last opened page in the tab
         parentPage = openerPage = lastPageInTab(tabInfo.id);
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage.pageId);
         break;

      // update page, not adding a new node
      case 'tabCreate-hmReopen':
         page = hmPages.find(p => p.incomingTabId === tabInfo.id);
         pageId = page.pageId;
         updatePage(pageId, 'reopen', { tab: tabInfo, docId: navInfo.documentId });
         break;
      case 'tabUpdate-forwardBack':
         let backPage = backTarget(tabInfo);
         let forwardPage = forwardTarget(tabInfo);
         if (backPage) {
            pageId = backPage.pageId;
            updatePage(pageId, 'back', { docId: navInfo.documentId });
         } else if (forwardPage) {
            pageId = forwardPage.pageId;
            updatePage(pageId, 'forward', { docId: navInfo.documentId });
         } else {
            // when the back/forward page is not in hmPages, i.e., opened before historymap
            // just add a new node, and link to the last opened page in the tab
            parentPage = openerPage = lastPageInTab(tabInfo.id);
            pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage.pageId);
         }
         break;
      case 'tabUpdate-reload':
      case 'tabUpdate-bookmarkEmpty':
      case 'tabUpdate-typedEmpty':
      case 'tabUpdate-searchEmpty':
         page = lastPageInTab(tabInfo.id);
         pageId = page.pageId;
         updatePage(pageId, 'reload', { tab: tabInfo, docId: navInfo.documentId });
         break;

      // do nothing
      case 'tabUpdate-clientRedirect':
         break;

      default:
         console.error('unhandled event: ', event);
   }

   function backTarget(tabInfo) {
      // if the grandparent page is the same as the parent page
      let parentPage = lastPageInTab(tabInfo.id);
      let grandparentPage = getParentPage(parentPage);
      if (
         grandparentPage
         && grandparentPage.tabId === tabInfo.id
         && grandparentPage.pageObj.url === tabInfo.url
      ) return parentPage;
      return null;
   }

   function forwardTarget(tabInfo) {
      // if the page is the same as its siblings
      let parentPage = lastPageInTab(tabInfo.id);
      let siblings = hmPages.filter(p => p.parentPageId === parentPage.pageId);
      if (!siblings) return null;
      let sameSibling = siblings.find(p =>
         p.tabId === tabInfo.id
         && p.pageObj.url === tabInfo.url
      );
      return sameSibling || null;
   }

   return pageId;
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

function lastOpenedPage() {
   let sortedHmPages = [...hmPages].sort((a, b) => a.time - b.time);
   return sortedHmPages[sortedHmPages.length - 1];
}

function lastPageInTab(tabId) {
   let sortedHmPages = [...hmPages].sort((a, b) => a.time - b.time); // sort by time
   let page = sortedHmPages.findLast((p) =>
      p.tabId === tabId
   );
   return page;
}

function getParentPage(page) {
   let parentPage = hmPages.find(p => p.pageId === page.parentPageId);
   return parentPage || null;
}

function closePagesInTab(tabId) {
   let pages = hmPages.filter(p => p.tabId === tabId && p.isOpened);
   pages.forEach(p => updatePage(p.pageId, 'close'));
}

function getTabInfo(tabId) {
   return new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
         } else if (!tab) {
            reject('Tab not found: ', tabId);
         } else {
            resolve(tab);
         }
      });
   });
}

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