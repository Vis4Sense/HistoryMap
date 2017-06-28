describe("Edge", function () {
    let singleNode = false,
		linkedToAnotherNode = false,
		linkedToPreviousNode = false;
		
		

    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/',
            linkUrl = 'http://www.mdx.ac.uk/our-research'; // Still need to copy this string in content script

        let linkClicked = false,
			actionTaken = false;
		
        var nodes = []; // All actions added in temporal order

        browser = sm.provenance.browser()
            .on('nodeCreated', function(node) {
				nodes.push(node) ;
				var firstNode = nodes[0];
				var lastNode = nodes[nodes.length - 1];
				
				console.log("NODES" + JSON.stringify(nodes, null, 2));
				
                // Call done() when required pages are loaded and ready to run the assertions
				//if (actionTaken) {
					singleNode = (firstNode == lastNode);
					linkedToAnotherNode = (lastNode.from != undefined);
					linkedToPreviousNode = (lastNode.from == firstNode.id);
					console.log(singleNode + " " + linkedToAnotherNode + " " + linkedToPreviousNode);
					done();
				//}	
            });

        chrome.tabs.create({ url: manualUrl, active: false }, function(tab) {
			//actionTaken = true;
        });
    });
	
		it('should NOT appear on the history map. | Testing: Edge, No New Edge', function() {
		expect(singleNode).toBe(true);
		expect(linkedToAnotherNode).toBe(false);
		expect(linkedToPreviousNode).toBe(false);
    });
});