// Note: historyMap model

// A opened webpage
class hmPage {
   constructor({ pageId, tabId, time, pageObj, parentPageId, docId=null, isOpened=true, isCollapsed=false, forwardBack={forward: 0, back: 0}, highlights=[], tags=[], incomingTabId=null }) {
      this.pageId = pageId;
      this.docId = docId; // a UUID of the document loaded, get from webNavigation API, needed for locating the page to update pageObj after navigation completed
      this.tabId = tabId;
      this.time = time;
      this.pageObj = pageObj;
      this.parentPageId = parentPageId;
      this.isOpened = isOpened;
      this.isCollapsed = isCollapsed;
      // this.clicked = false;
      this.forwardBack = forwardBack;
      this.highlights = highlights;
      this.tags = tags;

      // optional
      this.incomingTabId = incomingTabId; // the tabId of the incoming page, needed for locating the page that is reopened from hm tree
   }

   update(data) {
      for (let attr in data) {
         this[attr] = data[attr];
      }
   }

   increaseForwardBack(type) {
      this.forwardBack[type]++;
   }
}

// for reference only, not used
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
// class hmTab {
//    constructor(tabId, lastPageId) {
//       this.tabId = tabId;
//       this.lastPageId = lastPageId; // the last page opened in this tab
//   }
// }

// All the browser tabs ever opened
// let hmTabs = []