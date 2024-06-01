// TODO: Refactor this file

const ignoredUrls = [
   'chrome-extension://',
   'edge://extensions/'
];

function addPage(tabURL, docId, tabID, pageObj, parentPageId, isOpened=true) {
   if (!ignoredUrls.some(url => tabURL.includes(url))) {
      let newPageId = window.crypto.randomUUID();
      let newPage = new hmPage({
         pageId: newPageId,
         tabId: tabID,
         time: new Date(),
         pageObj,
         parentPageId,
         docId,
         isOpened
      });
      hmPages.push(newPage);
      console.log("A new hmPage added:", newPage.pageObj.title, ', ', newPage.pageObj.url);
      saveAllToLocalStorage();
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
      case 'toggleCollapse': // update page attributes
         page.update({ isCollapsed: !page.isCollapsed });
         break;
      case 'toggleTag':
         let tags = [...page.tags];
         const tag = data.tag;
         if (tags.includes(tag)) {
            tags = tags.filter(d => d !== tag);
         } else {
            tags.push(tag);
         }
         page.update({ tags });
         break;
      case 'addHighlight':
         const highlights = [...page.highlights, data.highlight];
         page.update({ highlights });
         break;
      case 'addNote':
         page.update({ note: data.note });
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

   saveAllToLocalStorage();
}

// Map navigation info to page event
function navigationToPageEvent(navInfo, tabInfo) {
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

// Map history state update event to page event
function historyStateUpdateToPageEvent(navInfo, tabInfo) {
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

   return event;
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
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage?.pageId);
         break;
      case 'tabCreate-webPopup':
         // link to the opener page
         // !! we don't know which page opens this, temporarily using the last opened page
         parentPage = openerPage = lastOpenedPage();
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage?.pageId);
         break;
      case 'tabCreate-historyPage':
      case 'tabCreate-clickLink':
         // link to the last page in the opener tab
         parentPage = openerPage = lastPageInTab(tabInfo.openerTabId);
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage?.pageId);
         break;
      case 'tabUpdate-clickLink':
      case 'tabUpdate-formSubmit':
         // link to the last opened page in the tab
         parentPage = openerPage = lastPageInTab(tabInfo.id);
         pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage?.pageId);
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
            pageId = addPage(tabInfo.url, navInfo.documentId, tabInfo.id, tabInfo, parentPage?.pageId);
         }
         break;
      case 'tabUpdate-reload':
      case 'tabUpdate-bookmarkEmpty':
      case 'tabUpdate-typedEmpty':
      case 'tabUpdate-searchEmpty':
      case 'tabUpdate-clientRedirect':
         page = lastPageInTab(tabInfo.id);
         pageId = page?.pageId;
         if (pageId) {
            updatePage(pageId, 'reload', { tab: tabInfo, docId: navInfo.documentId });
         }
         break;

      // // do nothing
      // case 'tabUpdate-clientRedirect':
      //    break;

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
