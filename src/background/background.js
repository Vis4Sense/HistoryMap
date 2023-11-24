// import './sw-import.js'

const MAIN_WINDOW_FILENAME = "/src/historymap/hm.html";

// Register an action click listener
chrome.action.onClicked.addListener(activate_main_window)
  

function activate_main_window(){
  // Construct the main_window URL
  const targetURL = chrome.runtime.getURL(MAIN_WINDOW_FILENAME);
  // Query tabs to find if any match the URL
  chrome.tabs.query({}, (tabs) => {
    let found = false;
    for (const tab of tabs) {
      if (tab.url === targetURL) {
        found = true;
        // Make the tab active within its window
        chrome.tabs.update(tab.id, { active: true });

        // Bring the window to the front
        chrome.windows.update(tab.windowId, {
          drawAttention: true,
          focused: true,
        });
        break;
      }
    }
    
    if (!found) {
      // Create the main_window
      chrome.windows.create({
        url: chrome.runtime.getURL(MAIN_WINDOW_FILENAME),
        //type: "panel", // As of 2023-10-31, panels are not supported and this creates a popup
        type: "popup", // or panel
      });
    }
  });  
}



// not working, maybe need to choose which tab the sidebar will be in: it should be the user tab and not the historymap tab/window
chrome.sidePanel
   .setPanelBehavior({ openPanelOnActionClick: true })
   .catch((error) => console.error(error))


// listen to events happening in user tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
   // console.log('%c tab', 'color: green', tabId, 'updated, url: ', tab.url)

   const data = {tabID: tabId, changeInfo: changeInfo, tab: tab}
   // send message to historymap.js
   chrome.runtime
     .sendMessage({
       type: "tabUpdated",
       data: data,
     })
     .catch((err) => {
       if (
         err.message ===
         "Could not establish connection. Receiving end does not exist."
       ) {
         // Ignore this error.
         // console.log(
         //   "sendMessage threw an error: Could not establish connection. Receiving end does not exist. It was ignored because this happens when there are nobody in the forest to hear the tree fall (no other contexts in the extension)."
         // );
       } else {
         // Throw the error.
         throw err;
       }
     });
})