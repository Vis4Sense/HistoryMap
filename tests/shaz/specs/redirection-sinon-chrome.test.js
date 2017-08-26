// here first url is the url start and the last is the url where it actually ends. 

redirectionTest();



function redirectionTest() {
	describe("Case: Redirection", function () {
		
		it('Testing: Redirection of URL from one to other', function() {

			const tabInfo1 = {
				"tabId": 1637,
				"changeInfo": {
					"status": "loading"
				},
				"tab": {
					"active": true,
					"audible": false,
					"autoDiscardable": true,
					"discarded": false,
					"height": 513,
					"highlighted": true,
					"id": 1637,
					"incognito": false,
					"index": 4,
					"mutedInfo": {
						"muted": false
					},
					"pinned": false,
					"selected": true,
					"status": "loading",
					"title": "movies.disney.com/finding-nemo",
					"url": "http://movies.disney.com/finding-nemo",
					"width": 784,
					"windowId": 1
				}
			};
			
			chrome.tabs.onUpdated.dispatch(tabInfo1.tabId, tabInfo1.changeInfo, tabInfo1.tab);
			const lastNode1 = _.last(sm.data.tree.nodes);
			var countStart = sm.data.tree.nodes.length;
			var urlStart = lastNode1.url;
			var faviconStart = lastNode1.favIconUrl;
			var beforeObj = sm.data.tree.nodes[0];
			
			const tabInfo2 = {
				"tabId": 1637,
				"changeInfo": {
					"status": "loading"
				},
				"tab": {
					"active": true,
					"audible": false,
					"autoDiscardable": true,
					"discarded": false,
					"height": 513,
					"highlighted": true,
					"id": 1637,
					"incognito": false,
					"index": 4,
					"mutedInfo": {
						"muted": false
					},
					"pinned": false,
					"selected": true,
					"status": "loading",
					"title": "Finding Nemo | Official Site | Disney Movies",
					"url": "http://movies.disney.com/finding-nemo",
					"width": 784,
					"windowId": 1
				}
			};
			chrome.tabs.onUpdated.dispatch(tabInfo2.tabId, tabInfo2.changeInfo, tabInfo2.tab);
			const lastNode2 = _.last(sm.data.tree.nodes);
			var titleStart = lastNode2.title;


			const tabInfo3 = {
				"tabId": 1637,
				"changeInfo": {
					"status": "loading"
				},
				"tab": {
					"active": true,
					"audible": false,
					"autoDiscardable": true,
					"discarded": false,
					"height": 513,
					"highlighted": true,
					"id": 1637,
					"incognito": false,
					"index": 4,
					"mutedInfo": {
						"muted": false
					},
					"pinned": false,
					"selected": true,
					"status": "loading",
					"title": "Finding Nemo | Official Site | Disney Movies",
					"url": "http://www.disneyinternational.com/",
					"width": 784,
					"windowId": 1
				}
			};
			
			chrome.tabs.onUpdated.dispatch(tabInfo3.tabId, tabInfo3.changeInfo, tabInfo3.tab);		
			var lastNode3 = _.last(sm.data.tree.nodes);

			const tabInfo4 = {
				"tabId": 1637,
				"changeInfo": {
					"status": "loading"
				},
				"tab": {
					"active": true,
					"audible": false,
					"autoDiscardable": true,
					"discarded": false,
					"height": 513,
					"highlighted": true,
					"id": 1637,
					"incognito": false,
					"index": 4,
					"mutedInfo": {
						"muted": false
					},
					"pinned": false,
					"selected": true,
					"status": "loading",
					"title": "Disney - Disney Online International",
					"url": "http://www.disneyinternational.com/",
					"width": 784,
					"windowId": 1
				}
			};
			chrome.tabs.onUpdated.dispatch(tabInfo4.tabId, tabInfo4.changeInfo, tabInfo4.tab);		
			const lastNode4 = _.last(sm.data.tree.nodes);
			
			
			const tabInfo5 = {
				"tabId": 1637,
				"changeInfo": {
					"status": "loading"
				},
				"tab": {
					"active": true,
					"audible": false,
					"autoDiscardable": true,
					"discarded": false,
					"height": 513,
					"highlighted": true,
					"favIconUrl":"http://www.disneyinternational.com/favicon.ico",
					"id": 1637,
					"incognito": false,
					"index": 4,
					"mutedInfo": {
						"muted": false
					},
					"pinned": false,
					"selected": true,
					"status": "loading",
					"title": "Disney - Disney Online International",
					"url": "http://www.disneyinternational.com/",
					"width": 784,
					"windowId": 1
				}
			};
			
			chrome.tabs.onUpdated.dispatch(tabInfo5.tabId, tabInfo5.changeInfo, tabInfo5.tab);		
			var lastNode5 = _.last(sm.data.tree.nodes);
			
			const tabInfo6 = {
				"tabId": 1637,
				"changeInfo": {
					"status": "complete"
				},
				"tab": {
					"active": true,
					"audible": false,
					"autoDiscardable": true,
					"discarded": false,
					"height": 513,
					"highlighted": true,
					"favIconUrl":"http://www.disneyinternational.com/favicon.ico",
					"id": 1637,
					"incognito": false,
					"index": 4,
					"mutedInfo": {
						"muted": false
					},
					"pinned": false,
					"selected": true,
					"status": "complete",
					"title": "Disney - Disney Online International",
					"url": "http://www.disneyinternational.com/",
					"width": 784,
					"windowId": 1
				}
			};
			chrome.tabs.onUpdated.dispatch(tabInfo6.tabId, tabInfo6.changeInfo, tabInfo6.tab);		
			
			lastNode6 = _.last(sm.data.tree.nodes);

			var countEnd = sm.data.tree.nodes.length
			var urlEnd = lastNode6.url;
			var titleEnd = lastNode6.title;
			var afterObj = sm.data.tree.nodes[0];
				
			expect(countStart).toEqual(countEnd); 	
			expect(urlStart).not.toEqual(urlEnd); 	
			expect(faviconStart).not.toBeDefined(); 	
			expect(titleStart).toEqual(titleEnd); 	
			
			
			for (var property in beforeObj) {
				if (beforeObj.hasOwnProperty(property)) {
					expect(beforeObj.property).toEqual(afterObj.property); 	
				}
			}
			

		});
	});	
}