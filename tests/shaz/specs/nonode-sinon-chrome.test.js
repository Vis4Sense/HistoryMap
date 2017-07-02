describe("Case 1: No New node", function () {
	
    it('Testing: No new node should appear on the history map when a new url is amongst the ignoreurl', function() {

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
                "favIconUrl": "",
                "height": 780,
                "highlighted": true,
                "id": 131,
                "incognito": false,
                "index": 11,
                "mutedInfo": {
                    "muted": false
                },
                "pinned": false,
                "selected": true,
                "status": "complete",
                "title": "Blank",
                "url": "chrome-extension://",
                "width": 964,
                "windowId": 1
            }
        };

        chrome.tabs.onUpdated.dispatch(tabInfo.tabId, tabInfo.changeInfo, tabInfo.tab);

        const lastNode = _.last(sm.data.tree.nodes);
		expect(lastNode.url).toBe(tabInfo.tab.url);
		console.log(lastNode.url);
		
    });
});