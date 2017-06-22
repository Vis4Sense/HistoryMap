describe("Unclear case 1: Duplicate URLs", function () {
    let caseManualUrl = false,
        caseLink = false,
        duplicatenode = false,
        duplicatelink = false,
        nodesformed=[],
        manualUrl2 = 'http://www.mdx.ac.uk/';

    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/',
            
            linkUrl = 'http://www.mdx.ac.uk/our-research'; // Still need to copy this string in content script

        let linkClicked1 = false, linkClicked2 = false;

        browser = sm.provenance.browser()
            .on('nodeCreated', function(action) {
                // console.log("node has been created", action.url);
                if (action.url === manualUrl) caseManualUrl = true;
                if (action.url === linkUrl) caseLink = true;
                if (action.url === manualUrl && nodesformed.includes(action.url)) 
                    duplicatenode = true; 
                if (action.url === linkUrl && nodesformed.includes(action.url)) {
                                        // console.log("yes!");    

                    duplicatelink = true;   
                    done();
                }
                nodesformed.push(action.url);

            });

        chrome.tabs.create({ url: manualUrl, active: false }, function(tab) {
            // This script will be called in the newly created page
            chrome.tabs.executeScript(tab.id, { code: `
                const queryString = "a[href='http://www.mdx.ac.uk/our-research']";
                const link = document.querySelector(queryString);
                link.click();
            ` }, function() {

                linkClicked1 = true;
            });
        });
        chrome.tabs.create({ url: manualUrl2, active: false }, function(tab) {
            // This script will be called in the newly created page
            chrome.tabs.executeScript(tab.id, { code: `
                const queryString = "a[href='http://www.mdx.ac.uk/our-research']";
                const link = document.querySelector(queryString);
                link.click();
            ` }, function() {
                linkClicked2 = true;
            });
        });
    });

    it('should appear on the history map when a duplicate url is manually entered', function() {
        expect(duplicatenode).toBeTruthy();
    });
    it('should appear on the history map when a duplicate link is clicked', function() {
        expect(duplicatelink).toBeTruthy();
    });
});

/*
describe("Unclear case 2: Old URLs", function () {
    let caseManualUrl = false,
        caseLink = false;

    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/',
            linkUrl = 'http://www.mdx.ac.uk/our-research'; // Still need to copy this string in content script

        let linkClicked = false;


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

        browser = sm.provenance.browser()
            .on('nodeCreated', function(action) {
                if (action.url === manualUrl) caseManualUrl = true;
                if (action.url === linkUrl) caseLink = true;

                // Call done() when required pages are loaded and ready to run the assertions
                if (linkClicked) done();
            });

    });

    // The normal test code becomes very simple because of the asynchronous test.
    it('should appear on the history map when a new url is manually entered', function() {
        expect(caseManualUrl).not.toBeTruthy();
    });
    it('should appear on the history map when a link is clicked', function() {
        expect(caseLink).not.toBeTruthy();
    });
});
*/