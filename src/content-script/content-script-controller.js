const initializeController = () => {
  // Only run after the background page opens. 
  chrome.runtime.sendMessage({ type: "backgroundOpened" }, function (response) {
    if (!response) return;
    respondExtension();
  });
}

const respondExtension = () => {
  chrome.runtime.onMessage.addListener(messageHandlers);
};

const messageHandlers = (request, sender, sendResponse) => {
  if (request.type === 'highlightSelection') {
    handleHighlightSelection(request, sender, sendResponse);
  }
}

const handleHighlightSelection = (request, sender, sendResponse) => {
  const selection = highlight.highlightSelection();
  console.log('highlight selection', selection);
  sendResponse(selection);
}
