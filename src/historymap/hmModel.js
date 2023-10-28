// Note: historyMap model

// A opened webpage
class hmPage {
   constructor(pageId, tabId, time, pageObj, parentPage) {
      this.pageId = pageId;
      this.tabId = tabId;
      this.time = time;
      this.pageObj = pageObj;
      this.parentPage = parentPage;
      // this.isOpened = isOpened;
      // this.clicked = false;
  }
}

// All the webpages ever opened
let hmPages = []

// A opened browser tab (the page opened in a tab can change)
class hmTab {
   constructor(tabId, lastPageID) {
      this.tabId = tabId;
      this.lastPageID = lastPageID; // the last page opened in this tab
  }
}

// All the browser tabs ever opened
let hmTabs = []