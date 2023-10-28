// import './sw-import.js'

// chrome.runtime.onInstalled.addListener( () => {
//    chrome.action.setBadgeText({
//       text: "Off"
//    })

//    console.log('HistoryMap: Background service work started.')
// })

chrome.action.onClicked.addListener(async (tab) => {

   const prevState = await chrome.action.getBadgeText({ tabId: tab.id })
   const nextState = prevState === 'On' ? 'Off' : 'On'

   chrome.action.setBadgeText({
      text: nextState
   })
   console.log("Current tab url: ", tab.url)

   // create the history map window
   // const url = chrome.extension.getURL("historyMap.html");
   // Only allow a single instance of the history map
   // if (getView(url)) {
   //    return;
   // }
   // Create an instance of the history map
   chrome.windows.create({
      url: "/src/historymap/historyMap.html",
      type: 'popup',
      // left: 0,
      // top: 0,
      // width: Math.floor(screen.width * 0.33),
      // height: screen.height
      // left: 0, // Math.floor(screen.width * 0.5),
      // top: Math.floor(screen.height * 0.7 + 25),
      // top: 0,
      // width: screen.width, // Math.floor(screen.width / 2),
      // height: Math.floor(screen.height * 0.3 - 25)
      // height: screen.height
   }, function (w) {
      chrome.windows.update(w.id, {
         focused: true
      });
   });
})

// not working, maybe need to choose which tab the sidebar will be in: it should be the user tab and not the historymap tab/window
chrome.sidePanel
   .setPanelBehavior({ openPanelOnActionClick: true })
   .catch((error) => console.error(error))


// listen to events happening in user tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
   console.log('tab', tabId + ' updated, title: ' + changeInfo.title + ', url: ' + changeInfo.url)

   const data = {tabID: tabId, changeInfo: changeInfo, tab: tab}
   // send message to historymap.js
   chrome.runtime.sendMessage({
      type: 'tabUpdated',
      data: data
   });

})