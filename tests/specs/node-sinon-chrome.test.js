describe("New node", function () {
    let caseManualUrl = false;

    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/';

        browser = historymap.controller.provenance.browser()
            .on('dataChanged', function(action) {
                if (action.url === manualUrl) caseManualUrl = true;

                // Call done() when required pages are loaded and ready to run the assertions
                done();
            });

        // I got this from console log in browser-provenance.js
        const t = {"tabId":828,"changeInfo":{"status":"complete"},"tab":{"active":true,"audible":false,"autoDiscardable":true,"discarded":false,"favIconUrl":"http://www.mdx.ac.uk/__data/assets/image/0021/7464/icon.png?v=0.1.10","height":780,"highlighted":true,"id":828,"incognito":false,"index":11,"mutedInfo":{"muted":false},"pinned":false,"selected":true,"status":"complete","title":"Home | Middlesex University London","url":"http://www.mdx.ac.uk/","width":964,"windowId":1}};

        chrome.tabs.onUpdated.dispatch(t.tabId, t.changeInfo, t.tab);

        // console.log(JSON.stringify({ tabId: tabId, changeInfo: changeInfo, tab: tab }));
    });

    // The normal test code becomes very simple because of the asynchronous test.
    it('should appear on the history map when a new url is manually entered', function() {
        sinon.assert.calledOnce(chrome.tabs.onUpdated.addListener);
        expect(caseManualUrl).toBeTruthy();
    });
});