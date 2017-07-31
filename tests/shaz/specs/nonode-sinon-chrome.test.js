var urlArray = [
	"chrome-extension://",
	"chrome-extension://sdsdsd",
	"chrome-extension://?id=gekbinhnlmhidijgdccmnakheaeplado",
	"chrome://",
	"chrome://sdsdsd",
	"chrome://?id=gekbinhnlmhidijgdccmnakheaeplado",
	"chrome-devtools://",
	"chrome-devtools://sdsdssd",
	"chrome-devtools://?id=gekbinhnlmhidijgdccmnakheaeplado",
	"localhost://",
	"localhost://sdsdsddsd",
	"view-source:",
	"view-source:sdsdsdsd",
	"view-source:?id=gekbinhnlmhidijgdccmnakheaeplado"
]

for (var i=0; i<urlArray.length;i++) {
	noNewNodeTest(urlArray[i]);
}

for (var i = 0; i < urlArray.length; i++) {
	noNewNodeTestWithDataPresent(urlArray[i]);	
}

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
		var beforeObj = sm.data.tree.nodes[0];
		var count1 = sm.data.tree.nodes.length;
//		var beforeTitle = sm.data.tree.nodes[0].text;
//		var beforeUrl = sm.data.tree.nodes[0].url;
//		var beforeFavicon = sm.data.tree.nodes[0].favIconUrl;
		
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
			var afterObj = sm.data.tree.nodes[0];
			var afterTitle = sm.data.tree.nodes[0].text;
			var afterUrl = sm.data.tree.nodes[0].url;
			var afterFavicon = sm.data.tree.nodes[0].favIconUrl;
			
			
			expect(count2).toEqual(count1); 	
//			expect(afterTitle).toEqual(beforeTitle); 	
//			expect(afterUrl).toEqual(beforeUrl); 	
//			expect(afterFavicon).toEqual(beforeFavicon); 	
			
			for (var property in beforeObj) {
				if (beforeObj.hasOwnProperty(property)) {
					if (afterObj.hasOwnProperty(property)) {
						expect(beforeObj.property).toEqual(afterObj.property); 	
					}
				}
			}

			
		});
	});	
}
