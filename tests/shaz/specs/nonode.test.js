describe('Case 1: No New node', function () {

    let caseNoNewNode = false;

    beforeAll(function(done) {

        var manualUrl = "https://chrome-extension://";
        browser = sm.provenance.browser()
            .on('nodeCreated', function(action) {

                if (action.url === manualUrl) {
                    caseNoNewNode = true;
                } 

                if(caseNoNewNode) done();
            });
            
            chrome.tabs.create({ url: manualUrl, active: false }, function(tab) {
				
        });
    });

it('Testing: No new node should appear on the history map when a new url is amongst the ignoreurl', function() {
    expect(caseNoNewNode).toBeTruthy();
    });
});