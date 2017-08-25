//Made by Reday Yahya | @RedayY
//Sensemap Jasmine Testing Specification Document
//Unit Testing for New Nodes

/*
Notes:
We can detect AJAX and let our Expansion do something
$(document).ajaxStart(function() { STUFF HERE });
$(document).ajaxStop(function() {  STUFF HERE  });

How would this help with pages refreshing?
-Use the start indicator to trigger refresh of given node
-Update history map
New version of testing using new version of Sensemap Rebuilt
*/

describe("Unit Testing Suit for New Node Creation", function () {

    it('It should accept the given tab and create a node. | Testing: Node Creation, Matching URL', function() {

        //Constructing Tab Information
        const tabInfo = {
            "tabId": 828,
            "changeInfo": {
                "status": "loading"
            },
            "tab": {
                "active": true,
                "audible": false,
                "autoDiscardable": true,
                "discarded": false,
                "favIconUrl": "http://www.mdx.ac.uk/__data/assets/image/0021/7464/icon.png?v=0.1.10",
                "height": 780,
                "highlighted": true,
                "id": 828,
                "incognito": false,
                "index": 11,
                "mutedInfo": {
                    "muted": false
                },
                "pinned": false,
                "selected": true,
                "status": "complete",
                "title": "Home | Middlesex University London",
                "url": "http://www.mdx.ac.uk/",
                "width": 964,
                "windowId": 1
            }
        };

        //Sending tab information to Sensemap
        chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);

        // Check if the last node contains information from 'tabInfo'
        const lastNode = _.last(sm.data.tree.nodes);

        expect(lastNode.text).toBe(tabInfo.tab.title);
        expect(lastNode.url).toBe(tabInfo.tab.url);
        expect(lastNode.favIconUrl).toBe(tabInfo.tab.favIconUrl);
    });

    it('It should create a Node without domain | Testing: Node Creation, no domain URL', function() {

        //Constructing Tab Information
        const tabInfo = {
            "tabId": 001,
            "changeInfo": {
                "status": "loading"
            },
            "tab": {
                "active": true,
                "audible": false,
                "autoDiscardable": true,
                "discarded": false,
                "favIconUrl": "",
                "height": 780,
                "highlighted": true,
                "id": 001,
                "incognito": false,
                "index": 1,
                "mutedInfo": {
                    "muted": false
                },
                "pinned": false,
                "selected": true,
                "status": "complete",
                "title": "bing",
                "url": "http://bing/",
                "width": 964,
                "windowId": 1
            }
        };

        //Sending tab information to Sensemap
        chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);

        // Check if the last node contains information from 'tabInfo'
        const lastNode = _.last(sm.data.tree.nodes);

        //Tasting Expectation
        expect(lastNode.url).toBe(tabInfo.tab.url);
    });

    it('It should create a node when using https | Testing: Node Creation, secure URL', function() {
    
        //Constructing Tab Information
        const tabInfo = {
            "tabId": 002,
            "changeInfo": {
                "status": "loading"
            },
            "tab": {
                "active": true,
                "audible": false,
                "autoDiscardable": true,
                "discarded": false,
                "favIconUrl": "https://www.google.co.uk/images/branding/product/ico/googleg_lodp.ico",
                "height": 780,
                "highlighted": true,
                "id": 002,
                "incognito": false,
                "index": 2,
                "mutedInfo": {
                    "muted": false
                },
                "pinned": false,
                "selected": true,
                "status": "complete",
                "title": "Google",
                "url": "https://google.com/",
                "width": 964,
                "windowId": 1
            }
        };

        //Sending tab information to Sensemap
        chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);

        // Check if the last node contains information from 'tabInfo'
        const lastNode = _.last(sm.data.tree.nodes);

        //Tasting Expectation
        expect(lastNode.url).toBe(tabInfo.tab.url);
    });

    it('It should create a new node even with weird URLs. | Testing: Node Creation, weirdo URL', function() {
    
        //Constructing Tab Information
        const tabInfo = {
            "tabId": 003,
            "changeInfo": {
                "status": "loading"
            },
            "tab": {
                "active": true,
                "audible": false,
                "autoDiscardable": true,
                "discarded": false,
                "favIconUrl": "",
                "height": 780,
                "highlighted": true,
                "id": 003,
                "incognito": false,
                "index": 3,
                "mutedInfo": {
                    "muted": false
                },
                "pinned": false,
                "selected": true,
                "status": "complete",
                "title": "sdjfrwerlwkejrljkwerlkjwe",
                "url": "http://sdjfrwerlwkejrljkwerlkjwe/",
                "width": 964,
                "windowId": 1
            }
        };

        //Sending tab information to Sensemap
        chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);

        // Check if the last node contains information from 'tabInfo'
        const lastNode = _.last(sm.data.tree.nodes);

        //Tasting Expectation
        expect(lastNode.url).toBe(tabInfo.tab.url);
    });
});