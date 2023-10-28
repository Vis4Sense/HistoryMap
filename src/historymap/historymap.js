chrome.runtime.onMessage.addListener(
   function (request, sender, sendResponse) {
      // console.log('update received.')
      console.log('sender: ', sender, 'data: ', request.data);
   }
);