chrome.scripting.executeScript(
   {
     target: {
       tabId // the tab you want to inject into
     },
     world: "MAIN", // MAIN to access the window object
     func: windowChanger // function to inject
   },
   () => {
     console.log("Background script got callback after injection")
   }
 )