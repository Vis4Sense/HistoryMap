import { initialiseController } from "./controller"

/** open side panel on clicking in toolbar */
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

self.onerror = function (message, source, lineno, colno, error) {
  console.info("Error: " + message)
  console.info("Source: " + source)
  console.info("Line: " + lineno)
  console.info("Column: " + colno)
  console.info("Error object: " + error)
}

console.info("hello world from background")

/** initialise controller */
initialiseController()

export {}
