// Note: historyMap model

// A opened webpage
class hmPage {
   constructor(pageId, tabId, time, pageObj, parentPageId) {
      this.pageId = pageId;
      this.tabId = tabId;
      this.time = time;
      this.pageObj = pageObj;
      this.parentPageId = parentPageId;
      // this.isOpened = isOpened;
      // this.clicked = false;
  }
}

// --- Kai: why do we need this?
const pageObj = {
   active: true,
   audible: false,
   autoDiscardable: true,
   discarded: false,
   favIconUrl:"",
   groupId:-1,
   height:993,
   highlighted:true,
   id:868440250,
   incognito: false,
   index:0,
   mutedInfo:{
      muted: false
   },
   pinned: false,
   selected: true,
   status: "complete",
   title: "HistoryMap",
   url: "chrome-extension://gmeblldapmldlnkmjfoijfifkbcaejam/src/historymap/hm.html",
   width: 1504,
   windowId: 868440249   
}

// All the webpages ever opened
let hmPages = []

// A opened browser tab (the page opened in a tab can change)
class hmTab {
   constructor(tabId, lastPageId) {
      this.tabId = tabId;
      this.lastPageId = lastPageId; // the last page opened in this tab
  }
}

// All the browser tabs ever opened
let hmTabs = []