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
Using Shaz way of testing each object
*/


//Thank you Shaz :)

urlLinkArray = [
    "http://www.mdx.ac.uk/",
    "https://google.com/",
    "http://sdjfrwerlwkejrljkwerlkjwe/",
    "http://bing/"
];


for (var i=0; i<urlLinkArray.length;i++) {
	testURL(urlLinkArray[i]);
}

function testURL(url) {

describe("Unit Testing Suit for New Node Creation", function () {

    it('It should accept the given tab and create a node. | Testing: Node Creation, Matching '+url, function() {

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
                "url": url,
                "width": 964,
                "windowId": 1
            }
        };

        //Sending tab information to Sensemap
        chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);

        // Check if the last node contains information from 'tabInfo'
        const lastNode = _.last(sm.data.tree.nodes);

        //Object Stored before
        var beforeObj = sm.data.tree.nodes[0];



        if (lastNode.status != "Loading") {
            expect(lastNode.text).toBe(tabInfo.tab.title);
            expect(lastNode.url).toBe(tabInfo.tab.url);
            expect(lastNode.favIconUrl).toBe(tabInfo.tab.favIconUrl);
        }
        else
            {
                expect(lastNode.status).tobe("Loading");
            }
        //After Object
        var afterObj = sm.data.tree.nodes[0];   
        
        
        			for (var property in beforeObj) {
				if (beforeObj.hasOwnProperty(property)) {
						expect(beforeObj.property).toEqual(afterObj.property); 	
				}
			}


    });  
})};