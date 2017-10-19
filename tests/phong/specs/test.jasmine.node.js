describe("New node", function () {
    let caseManualUrl = false,
        caseLink = false;

    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/',
            linkUrl = 'http://www.mdx.ac.uk/our-research'; // Still need to copy this string in content script

        let linkClicked = false;

        browser = historymap.controller.provenance.browser()
            .on('dataChanged', function(action) {
                if (action.url === manualUrl) caseManualUrl = true;
                if (action.url === linkUrl) caseLink = true;

                // Call done() when required pages are loaded and ready to run the assertions
                if (linkClicked) done();
            });

        chrome.tabs.create({ url: manualUrl, active: false }, function(tab) {
            // This script will be called in the newly created page
            chrome.tabs.executeScript(tab.id, { code: `
                const queryString = "a[href='http://www.mdx.ac.uk/our-research']";
                const link = document.querySelector(queryString);
                link.click();
            ` }, function() {
                linkClicked = true;
            });
        });
    });

    // The normal test code becomes very simple because of the asynchronous test.
    it('should appear on the history map when a new url is manually entered', function() {
        expect(caseManualUrl).toBeTruthy();
    });
    it('should appear on the history map when a link is clicked', function() {
        expect(caseLink).toBeTruthy();
    });
});