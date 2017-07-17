// here first url is the url start and the last is the url where it actually ends. 

redirectiontest("http://movies.disney.com/finding-nemo","http://www.disneyinternational.com/");

function redirectiontest(urlstart,urlend) {
	describe("Case: Redirection", function () {
		
		it('Testing: Redirection of URL from one to other', function() {

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
					"title": "Disney - Disney Online International",
					"url": urlend,
					"width": 964,
					"windowId": 1
				}
			};
			
			chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);
			
			const lastNode = _.last(sm.data.tree.nodes);
			expect(lastNode.url).not.toBe(urlstart); 
			

		});
	});	
}