describe("New node", function () {
    it('should appear on the history map when url is updated', function() {
        // I got this from console log in browser-provenance.js
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

        // Check if the last node contains information from 't'
        const lastNode = _.last(sm.data.tree.nodes);
        expect(lastNode.text).toBe(tabInfo.tab.title);
        expect(lastNode.url).toBe(tabInfo.tab.url);
        expect(lastNode.favIconUrl).toBe(tabInfo.tab.favIconUrl);
    });
});