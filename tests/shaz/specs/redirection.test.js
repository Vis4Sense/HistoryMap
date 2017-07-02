describe('Case 2: Redirection Test', function () {

    let caseRedirection = false;

    beforeAll(function(done) {

        var manualUrl = "http://movies.disney.com/finding-nemo";
        browser = sm.provenance.browser()
            .on('nodeCreated', function(action) {
			
				console.log(action.url);
				if (action.url !== manualUrl) {
                   caseRedirection = true;
                } 

                if(caseRedirection) done();
				
            });
            
            chrome.tabs.create({ url: manualUrl, active: false }, function(tab) {
				
        });
    });

it('Testing: Redirection of URL from one to other', function() {
    expect(caseRedirection).toBeTruthy();
    });
});