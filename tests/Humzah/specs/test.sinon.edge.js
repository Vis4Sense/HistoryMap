describe("Edge", function () {
    it('should appear on the history map. | Testing: Edge, New Edge (Link clicked)', function() {
		 browser = sm.provenance.browser()
            .on('nodeCreated', function(node) {
				console.log("node created " + JSON.stringify(node, null, 3));
			})
				
        const tabInfo = {
            "tabId": 101,
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
                "id": 101,
                "incognito": false,
                "index": 0,
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
		
		const tabInfo1 = {
			"tabId": 101,
			"changeInfo" : {
				"status": "loading"
			},
			"tab": {
				"active": true,
				"audible": false, 
				"autoDiscardable": true,
				"discarded": false,
				"height": 662,
				"highlighted": true,
				"id": 101,
				"incognito": false,
				"index": 0,
				"mutedInfo": {
					"muted": false
					}, 
				"pinned":false,
				"selected":true,
				"status":"loading",
				"title":"www.mdx.ac.uk/our-research", 
				"url":"http://www.mdx.ac.uk/our-research", 
				"width":1366,
				"windowId": 1 
			}
		};
		
		chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);
		const firstNode = _.last(sm.data.tree.nodes);
		chrome.tabs.onUpdated.dispatch(tabInfo1.tabId, tabInfo1.changeInfo, tabInfo1.tab);
		const secondNode = _.last(sm.data.tree.nodes);
		expect(secondNode.from).toEqual(firstNode.id);
    });
	
	it('should NOT appear on the history map. | Testing: Edge, No New Edge', function() {
		const tabInfo2 = {
            "tabId": 103,
            "changeInfo": {
                "status": "loading"
            },
            "tab": {
			  "active": true,
			  "audible": false,
			  "autoDiscardable": true,
			  "discarded": false,
			  "favIconUrl": "http://static-hp-neu-s-msn-com.akamaized.net/sc/2b/a5ea21.ico",
			  "height": 662,
			  "highlighted": true,
			  "id": 103,
			  "incognito": false,
			  "index": 1,
			  "mutedInfo": {
				"muted": false
			  },
			  "pinned": false,
			  "selected": true,
			  "status": "loading",
			  "title": "MSN UK | Latest news, Hotmail sign in, Outlook email, Skype, live scores",
			  "url": "http://www.msn.com/en-gb",
			  "width": 1366,
			  "windowId": 1
			}
		};
		
		chrome.tabs.onUpdated.dispatch(tabInfo2.tabId, tabInfo2.changeInfo, tabInfo2.tab);
		const thirdNode = _.last(sm.data.tree.nodes);
		expect(thirdNode.from).toEqual(undefined);
	});
	
	it('should appear on the history map. | Testing: Edge, Unclear (Related URL)', function() {
		const tabInfo3 = {
			"tabId": 104,
			"changeInfo": {
				"status": "loading"
			},
			"tab": {
			  "active": true,
			  "audible": false,
			  "autoDiscardable": true,
			  "discarded": false,
			  "favIconUrl": "https://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico?v=4f32ecc8f43d",
			  "height": 780,
			  "highlighted": true,
			  "id": 104,
			  "incognito": false,
			  "index": 3,
			  "mutedInfo": {
				"muted": false
			  },
			  "pinned": false,
			  "selected": true,
			  "status": "loading",
			  "title": "Stack Overflow - Where Developers Learn, Share, & Build Careers",
			  "url": "https://stackoverflow.com/",
			  "width": 964,
			  "windowId": 1
			}
		};

		const tabInfo4 = {
            "tabId": 105,//equal to tabInfo4.tab.id = 104 
            "changeInfo": {
                "status": "loading"
            },
            "tab": {
				"active": true,
				"audible": false,
				"autoDiscardable": true,
				"discarded": false,
				"favIconUrl": "https://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico?v=4f32ecc8f43d",
				"height": 662,
				"highlighted": true,
				"id": 104,
				"incognito": false,
				"index": 2,
				"mutedInfo": {
				"muted": false
				},
				"pinned": false,
				"selected": true,
				"status": "loading",
				"title": "Newest Questions - Stack Overflow",
				"url": "https://stackoverflow.com/questions",
				"width": 1366,
				"windowId": 1
			}
		};
		
		chrome.tabs.onUpdated.dispatch(tabInfo3.tabId, tabInfo3.changeInfo, tabInfo3.tab);
		const fourthNode = _.last(sm.data.tree.nodes);
		chrome.tabs.onUpdated.dispatch(tabInfo4.tabId, tabInfo4.changeInfo, tabInfo4.tab);
		const fifthNode = _.last(sm.data.tree.nodes);
		expect(fifthNode.from).toEqual(fourthNode.id);
	});

	it('should NOT appear on the history map. | Testing: Edge, Unclear (Unrelated URL)', function() {		
		const tabInfo5 = {
            "tabId": 106,
            "changeInfo": {
                "status": "loading"
            },
            "tab": {
			  "active": true,
			  "audible": false,
			  "autoDiscardable": true,
			  "discarded": false,
			  "favIconUrl": "https://uk.yahoo.com/sy/rz/l/favicon.ico",
			  "height": 662,
			  "highlighted": true,
			  "id": 106,
			  "incognito": false,
			  "index": 4,
			  "mutedInfo": {
				"muted": false
			  },
			  "pinned": false,
			  "selected": true,
			  "status": "loading",
			  "title": "MSN UK | Latest news, Hotmail sign in, Outlook email, Skype, live scores",
			  "url": "https://uk.yahoo.com/?p=us",
			  "width": 1366,
			  "windowId": 1
			}
		};
		
		const tabInfo6 = {
			"tabId": 106,
			"changeInfo": {
				"status" : "loading",
			},
			"tab": {
			  "active": true,
			  "audible": false,
			  "autoDiscardable": true,
			  "discarded": false,
			  "favIconUrl": "http://s.hswstatic.com/en-us/hsw/img/favicon-32x32.png",
			  "height": 662,
			  "highlighted": true,
			  "id": 106,
			  "incognito": false,
			  "index": 3,
			  "mutedInfo": {
				"muted": false
			  },
			  "pinned": false,
			  "selected": true,
			  "status": "loading",
			  "title": "HowStuffWorks - Learn How Everything Works!",
			  "url": "http://www.howstuffworks.com/",
			  "width": 1366,
			  "windowId": 1
			}
		};
		
		chrome.tabs.onUpdated.dispatch(tabInfo5.tabId, tabInfo5.changeInfo, tabInfo5.tab);
		const sixthNode = _.last(sm.data.tree.nodes);
		chrome.tabs.onUpdated.dispatch(tabInfo6.tabId, tabInfo6.changeInfo, tabInfo6.tab);
		const seventhNode = _.last(sm.data.tree.nodes);
		expect(seventhNode.from).toEqual(undefined);
	});
});