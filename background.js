import './sw-import.js'

// chrome.runtime.onInstalled.addListener( () => {
//    chrome.action.setBadgeText({
//       text: "Off"
//    })

//    console.log('HistoryMap: Background service work started.')
// })

chrome.action.onClicked.addListener( async (tab) => {
   
   const prevState = await chrome.action.getBadgeText({tabId: tab.id})
   const nextState = prevState === 'On' ? 'Off' : 'On'
   
   chrome.action.setBadgeText({
      text: nextState
   })
   console.log("Current tab url: ", tab.url)
})

chrome.sidePanel
   .setPanelBehavior({openPanelOnActionClick:true})
   .catch( (error) => console.error(error) )