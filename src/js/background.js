document.addEventListener('DOMContentLoaded', function() {
    // Called when the browser action is clicked.
    chrome.browserAction.onClicked.addListener(initInstance);
    /**
     * Init an instance of SenseMapExtension
     */
    function initInstance() {
        // Get the main view or create if it doesn't exist
        var url = chrome.extension.getURL('/src/pages/history-map.html'),
            windowWidth = parseInt(screen.width / 3),
            view = chrome.extension.getViews().find(v => v.location.href === url);

        // Allow a single instance
        if (view) {
            let backgroundPage = chrome.extension.getBackgroundPage();
            if (backgroundPage.options.inSeparatedTab) {
                chrome.tabs.update(backgroundPage.options.historyMapId, {active: true});
            } else {
                chrome.windows.update(backgroundPage.options.historyMapId, {focused: true});
            }
            return;
        }

        // Shared by all views
        chrome.storage.sync.get({
            debugHistory: false,
            debugKnowledge: false,
            debugOthers: false,
            testTab: false,
            noSnapshots: false,
            labelGenerator: false,
            autoSave: true,
            firefoxSnapshot: false,
            inSeparatedTab: false,
            markLastNodes: true,
            inventory: false,
            indexedDB: false,
            api: 'http://bigdata.mdx.ac.uk:8080/sensemapext'
        }, function(options) {
            // Launch the test if the option testTab is true
            if (options.testTab) {
                runTestsAsSeparatedTab();
            }
            // Launch the application
            if (options.inSeparatedTab) {
                runAsSeparatedTab();
            } else {
                runAsSeparatedWindows();
            }
            // Listen to content script
            chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                if (request.type === 'backgroundOpened') { // To respond that background page already opened
                    sendResponse(true);
                }
            });
            // Just in case remove all the context menu of this extension (it was moved from the module browser.js)
            chrome.contextMenus.removeAll();
            // To highlight selected text
            chrome.contextMenus.create({
                id: 'sm-highlight',
                title: 'Highlight "%s"',
                contexts: ['selection']
            });
            // To save image
            chrome.contextMenus.create({
                id: 'sm-save-image',
                title: 'Set as Page Image',
                contexts: ['image']
            });
            return;
            /**
             * Run the application in a separated tab
             */
            function runAsSeparatedTab() {
                chrome.tabs.query({url: url}, tabs => {
                    var tab = tabs[0];
                    if (tab) {
                        // Switch to that tab
                        chrome.tabs.update(tab.id, {active: true});
                    } else {
                        // Create the tab with all the tests
                        chrome.tabs.create({url: url}, storeOptions);
                    }
                });
            }
            /**
             * Run the application in a separated window
             */
            function runAsSeparatedWindows() {
                // Resize current window
                chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
                    left: windowWidth,
                    top: 0,
                    width: screen.width - windowWidth,
                    height: screen.height
                });

                // Create collection view
                chrome.windows.create({
                    url: url,
                    type: 'popup',
                    left: 0,
                    top: 0,
                    width: windowWidth,
                    height: screen.height - (options.debugHistory ? 600 : 0)
                }, storeOptions);
            }
            /**
             * Store the options of the created window in the background page
             *
             * @param {Object} appWindow
             */
            function storeOptions(appWindow) {
                var backgroundPage = chrome.extension.getBackgroundPage();
                // Added debug key to all the modules
                backgroundPage.options = options;
                // Save a windows id of History Map
                backgroundPage.options.historyMapId = appWindow.id;
                // Get user email
                chrome.identity.getProfileUserInfo(userInfo => {
                    backgroundPage.options.email = userInfo.email;
                });
            }
            /**
             * Run all the tests in a separated tab
             */
            function runTestsAsSeparatedTab() {
                var testURL = chrome.extension.getURL('/test/test.html');
                chrome.tabs.query({url: testURL}, tabs => {
                    var tab = tabs[0];
                    if (tab) {
                        // Switch to that tab
                        chrome.tabs.update(tab.id, {active: true});
                    } else {
                        // Create the tab with all the tests
                        chrome.tabs.create({url: testURL}, storeOptions);
                    }
                });
            }
        });
    }
});
