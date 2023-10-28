chrome.runtime.onMessage.addListener(
   function (request, sender, sendResponse) {

      // There are a few update events when a new page is loaded. changeInfo.status === 'complete' is when the page loading finishes.
      if (request.data.changeInfo.status === 'complete') {

         // debug
         console.log('page updated: ', request.data);
         
         let newPageId = window.crypto.randomUUID()

         // check if a page opened in this tab before
         let parentTab = hmTabs.find(t => t.tabId === request.data.tabID)
         let parentPageID

         // create a hmTab object if this is a new tab
         if (!parentTab) {
            let newTab = new hmTab(request.data.tabID, newPageId)
            hmTabs.push(newTab)

            // if the tab is opened by another tab, the 'openerTabId' property will be set
            let parentTabID = request.data.tab.openerTabId
            if (parentTabID) {
               parentPageID = hmTabs.find(t => t.tabId === parentTabID).lastPageID
            }
            else {
               parentPageID = null
            }
         }
         else {
            parentPageID = parentTab.lastPageID
         }

         // Create a new hmPage object
         let newPage = new hmPage(
            newPageId,
            request.data.tabID,
            new Date(),
            request.data.tab,
            parentPageID
         )

         hmPages.push(newPage)

         // console.log('%c newPage added: ', 'color:orange', newPage);
      }
   }
);