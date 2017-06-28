describe("Edge", function () {
    let singleNode = false,
		linkedToAnotherNode = false,
		linkedToPreviousNode = false;
		
		

    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/',
            linkUrl = 'http://www.mdx.ac.uk/our-research', // Still need to copy this string in content script
			unrelatedUrl = '"https://stackoverflow.com/questions/1891738/how-to-modify-current-url-location-in-chrome-via-extensions/';
			
        let urlChanged = false,
			actionTaken = false;
		
        var nodes = []; // All actions added in temporal order

        browser = sm.provenance.browser()
            .on('nodeCreated', function(node) {
				nodes.push(node) ;
				var firstNode = nodes[0];
				var lastNode = nodes[nodes.length - 1];
				
				console.log("NODES" + JSON.stringify(nodes, null, 2));
				
                // Call done() when required pages are loaded and ready to run the assertions
                if (actionTaken) {
					console.log(JSON.stringify(firstNode, null, 2));
					console.log(JSON.stringify(lastNode, null, 2));
					
					singleNode = (firstNode == lastNode);
					linkedToAnotherNode = (lastNode.from != undefined);
					linkedToPreviousNode = (lastNode.from == firstNode.id);
					done();
				}
            });

        chrome.tabs.create({ url: manualUrl, active: false }, function(tab) {
            // Simulate change of url (new url is related to the previous page) 
           	chrome.tabs.update(tab.id, {url: linkUrl}, function() {
				actionTaken = true;
			});
        });
    });

		it('should appear on the history map. | Testing: Edge, Unclear (Related URL)', function() {
		expect(singleNode).toBe(false);
		expect(linkedToAnotherNode).toBe(true);
		expect(linkedToPreviousNode).toBe(true);
    });
});