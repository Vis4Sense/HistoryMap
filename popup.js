document.addEventListener('DOMContentLoaded', function() {
  var openButton = document.getElementById('openButton');
  var optionSelect = document.getElementById('optionSelect');

  // Event listener for the Open button
  openButton.addEventListener('click', function() {
    var selectedOption = optionSelect.value;
    const experiences = [
      "/src/historymap/hm.html", 
      "/src/historymap/simple_html_tree/simple_tree.html"
    ]
    activate_main_window(experiences[optionSelect.selectedIndex]);
  });

  // Event listener for the option select dropdown
  optionSelect.addEventListener('change', function() {
      var selectedOption = this.value;
      console.log('Option changed to:', selectedOption);
      // You can add more code here to handle the option change
  });
});


function activate_main_window(main_window_filename){
  // Construct the main_window URL
  const targetURL = chrome.runtime.getURL(main_window_filename);
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
        url: chrome.runtime.getURL(main_window_filename),
        //type: "panel", // As of 2023-10-31, panels are not supported and this creates a popup
        type: "popup", // or panel
      });
    }
  });  
}
