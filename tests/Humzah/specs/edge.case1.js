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
                if (linkClicked) {
					singleNode = (firstNode == lastNode);
					linkedToAnotherNode = (lastNode.from != undefined);
					linkedToPreviousNode = (lastNode.from == firstNode.id);
					console.log(singleNode + " " + linkedToAnotherNode + " " + linkedToPreviousNode);
					done();
				}
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
		it('should appear on the history map. | Testing: Edge, New Edge (Link clicked)', function() {
		expect(singleNode).toBe(false);
		expect(linkedToAnotherNode).toBe(true);
		expect(linkedToPreviousNode).toBe(true);
    });
});