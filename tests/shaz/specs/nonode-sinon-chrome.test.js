nonownodetest("chrome-extension://");
nonownodetest("chrome-extension://sdsdsd");
nonownodetest("chrome-extension://?id=gekbinhnlmhidijgdccmnakheaeplado");
nonownodetest("chrome://");
nonownodetest("chrome://sdsdsd");
nonownodetest("chrome://?id=gekbinhnlmhidijgdccmnakheaeplado");
nonownodetest("chrome-devtools://");
nonownodetest("chrome-devtools://sdsdssd");
nonownodetest("chrome-devtools://?id=gekbinhnlmhidijgdccmnakheaeplado");
nonownodetest("localhost://");
nonownodetest("localhost://sdsdsddsd");
nonownodetest("view-source:");
nonownodetest("view-source:sdsdsdsd");
nonownodetest("view-source:?id=gekbinhnlmhidijgdccmnakheaeplado");

function nonownodetest(url) {
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
					"status": "complete",
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
