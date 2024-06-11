let treeView = hmTreeView();

const cntInitVisibleNodes = 5;
let visibleIndex = 0;
let isLoading = false;

let displayTree = (data) => {
   let data_ = data.slice(visibleIndex);
   treeView.hmPageArray(data_).display();
};

function loadMore() {
   if (visibleIndex === 0) return;
   document.getElementById('loading-tip').style.display = 'none';
   document.getElementById('loading-icon').style.display = 'block';
   setTimeout(() => {
      visibleIndex = Math.max(0, visibleIndex - 10);
      displayTree(hmPages);
      if (visibleIndex > 0) {
         document.getElementById('loading-tip').style.display = 'block';
      }
      document.getElementById('loading-icon').style.display = 'none';
      isLoading = false;
   }, 1000);
}

function registerScrollTopListener() {
   const container = document.getElementById('hm-view-container');
   container.addEventListener('wheel', function(e) {
      if (e.deltaY < 0 && container.scrollTop === 0 && !isLoading) {
         isLoading = true;
         loadMore();
      }
   });
}

function initializeHmPages() {
   // if (window.self == window.top) {
   //    hmPages = dataExample.hmPages.map(p => new hmPage(p));
   // }
   // add all the tabs opened before running historymap to hmPages
   // chrome.tabs.query({}, function (openedTabs) {
   //    console.log("Tabs opened before historymap: ", openedTabs);
   //    hmPages = []
   //    for (let i = 0; i < openedTabs.length; i++) {
   //       addPage(openedTabs[i].url, null, openedTabs[i].id, openedTabs[i], null);
   //    }
   //    // displayTree(hmPages);
   // });
   loadAllFromLocalStorage(() => {
      visibleIndex = Math.max(0, hmPages.length - cntInitVisibleNodes);
      if (visibleIndex === 0) {
         document.getElementById('loading-tip').style.display = 'none';
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
      if (pageId) {
         captureTabUpdate(pageId);
      }
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

function handleTabActivated(details) {
   getTabInfo(details.tabId)
      .then(tab => mainHandler(tab))
      .catch(err => console.error(err));

   function mainHandler(tabInfo) {
      let page = lastPageInTab(tabInfo.id), pageId;

      // set the old visible page as invisible
      hmPages
         .filter(p => p.isVisible)
         .forEach(p => updatePage(p.pageId, 'update', { isVisible: false }));

      // if page is saved in hmPages, set it as visible and scroll to it
      if (page && tabInfo.url === page.pageObj.url) {
         pageId = page.pageId;

         // if the node is not visible, update visibleIndex
         const pageIndex = hmPages.findIndex(p => p.pageId === page.pageId);
         if (pageIndex < visibleIndex) {
            visibleIndex = Math.max(0, pageIndex - cntInitVisibleNodes + 1);
         }
      }
      // if the page is not yet saved, save it as a new node
      else {
         const event = 'tabCreate-activate';
         pageId = pageEventToHmPagesUpdate(event, null, tabInfo);
      }

      updatePage(pageId, 'update', { isVisible: true });
      displayTree(hmPages);

      // scroll to the element
      let element = document.getElementById(`hmtree-node-${page.pageId}`);
      element.scrollIntoView({behavior: 'smooth'});
   }
}

// register listeners
chrome.webNavigation.onHistoryStateUpdated.addListener(handleHistoryStateUpdated);
chrome.webNavigation.onCommitted.addListener(handleNavigationCommitted);
chrome.webNavigation.onCompleted.addListener(handleNavigationCompleted);
chrome.tabs.onRemoved.addListener(handleTabRemoved);
chrome.tabs.onActivated.addListener(handleTabActivated);

function handleToggleCollapse(pageId) {
   updatePage(pageId, 'toggleCollapse');
   displayTree(hmPages);
}

// When the window is open, the History Map is on
window.addEventListener("DOMContentLoaded", function () {
   toggle_badge("On");
   registerScrollTopListener();
   // Initialize hmPages
   initializeHmPages();
   // var iframe = document.getElementById('tree_view');
   // var iframeWindow = iframe.contentWindow;
   // iframe.onload = function () {
   //    // Access global variables
   //    displayTree = iframeWindow.displayTree;
   //    displayTree(hmPages);
   // }
   // displayTree(hmPages);
});

window.addEventListener("beforeunload", function () {
   toggle_badge("Off");
});

async function toggle_badge(state) {
   chrome.action.setBadgeText({
      text: state,
   });
}
