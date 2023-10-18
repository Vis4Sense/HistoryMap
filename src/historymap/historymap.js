chrome.runtime.onMessage.addListener(
   function (request, sender, sendResponse) {
      // console.log('update received.')
      console.log('data: ', request.data);
   }
);