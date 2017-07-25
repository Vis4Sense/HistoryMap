noNewNodeTest("chrome-extension://");
noNewNodeTest("chrome-extension://sdsdsd");
noNewNodeTest("chrome-extension://?id=gekbinhnlmhidijgdccmnakheaeplado");
noNewNodeTest("chrome://");
noNewNodeTest("chrome://sdsdsd");
noNewNodeTest("chrome://?id=gekbinhnlmhidijgdccmnakheaeplado");
noNewNodeTest("chrome-devtools://");
noNewNodeTest("chrome-devtools://sdsdssd");
noNewNodeTest("chrome-devtools://?id=gekbinhnlmhidijgdccmnakheaeplado");
noNewNodeTest("localhost://");
noNewNodeTest("localhost://sdsdsddsd");
noNewNodeTest("view-source:");
noNewNodeTest("view-source:sdsdsdsd");
noNewNodeTest("view-source:?id=gekbinhnlmhidijgdccmnakheaeplado");
noNewNodeTestWithDataPresent("chrome-extension://");
noNewNodeTestWithDataPresent("chrome-extension://sdsdsd");
noNewNodeTestWithDataPresent("chrome-extension://?id=gekbinhnlmhidijgdccmnakheaeplado");
noNewNodeTestWithDataPresent("chrome://");
noNewNodeTestWithDataPresent("chrome://sdsdsd");
noNewNodeTestWithDataPresent("chrome://?id=gekbinhnlmhidijgdccmnakheaeplado");
noNewNodeTestWithDataPresent("chrome-devtools://");
noNewNodeTestWithDataPresent("chrome-devtools://sdsdssd");
noNewNodeTestWithDataPresent("chrome-devtools://?id=gekbinhnlmhidijgdccmnakheaeplado");
noNewNodeTestWithDataPresent("localhost://");
noNewNodeTestWithDataPresent("localhost://sdsdsddsd");
noNewNodeTestWithDataPresent("view-source:");
noNewNodeTestWithDataPresent("view-source:sdsdsdsd");
noNewNodeTestWithDataPresent("view-source:?id=gekbinhnlmhidijgdccmnakheaeplado");

function noNewNodeTest(url) {
	describe("Case: No New node", function () {
		it('Testing: No new node should appear on the history map when a new url is: '+url, function() {
			// I got this from console log in browser-provenance.js
			const tabInfo = {
				"tabId": 131,
				"changeInfo": {
					"status": "loading"
				},
				"tab": {
					"active": true,
					"audible": false,
					"autoDiscardable": true,
					"discarded": false,
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
					"status": "loading",
					"title": "",
					"url": url,
					"width": 964,
					"windowId": 1
				}
			};
			
			chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);
			const lastNode = _.last(sm.data.tree.nodes);
			expect(lastNode).not.toBeDefined(); 
		});
	});	
}


function noNewNodeTestWithDataPresent(url) {
	describe("Case: No New node with Data Present", function () {
		it('Testing: No new node should appear on the history map when a new url is: '+url, function() {
			
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

        chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);

		const lastNode = _.last(sm.data.tree.nodes);
		var count1 = sm.data.tree.nodes.length;
			
		const tabInfoBlank = {
				"tabId": 131,
				"changeInfo": {
					"status": "loading"
				},
				"tab": {
					"active": true,
					"audible": false,
					"autoDiscardable": true,
					"discarded": false,
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
					"status": "loading",
					"title": "",
					"url": url,
					"width": 964,
					"windowId": 1
				}
			};
			
			chrome.tabs.onUpdated.dispatch(tabInfoBlank.tabId, tabInfoBlank.changeInfo, tabInfoBlank.tab);
			const lastNodetabBlank = _.last(sm.data.tree.nodes);
			var count2 = sm.data.tree.nodes.length;
			expect(count2).toEqual(count1); 	
			
			
		});
	});	
}
