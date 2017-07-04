describe("Edge", function () {
    let case1SingleNode = false,
		case1LinkedToAnotherNode = false,
		case1LinkedToPreviousNode = false;
		
		
    let case2SingleNode = false,
		case2LinkedToAnotherNode = false,
		case2LinkedToPreviousNode = false;
		
		

    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/',
			  linkUrl = 'http://www.mdx.ac.uk/our-research', // Still need to copy this string in content script
			  altUrl = 'http://www.google.co.uk';
			
        let linkClicked = false,
			actionTaken = false;
		
		//flag to make sure case2 is complete before testing case1
		let case2Complete = false;
		
        var nodes = []; // All actions added in temporal order

        browser = sm.provenance.browser()
            .on('nodeCreated', function(node) {
				nodes.push(node) ;
				var firstNode = nodes[0];
				var lastNode = nodes[nodes.length - 1];
				
				console.log("NODES" + JSON.stringify(nodes, null, 2));
				// Call done() when required pages are loaded and ready to run the assertions
				if (linkClicked && case2Complete) {
					case1SingleNode = (firstNode == lastNode);
					case1LinkedToAnotherNode = (lastNode.from != undefined);
					case1LinkedToPreviousNode = (lastNode.from == firstNode.id);
					console.log(case1SingleNode + " " + case1LinkedToAnotherNode + " " + case1LinkedToPreviousNode);
					done();
				}
				
                if (actionTaken) {
					case2SingleNode = (firstNode == lastNode);
					case2LinkedToAnotherNode = (lastNode.from != undefined);
					case2LinkedToPreviousNode = (lastNode.from == firstNode.id);
					console.log(case2SingleNode + " " + case2LinkedToAnotherNode + " " + case2LinkedToPreviousNode);
					case2Complete = true;
					//done();
				}	
            });

		//case2
        chrome.tabs.create({ url: altUrl, active: false }, function(tab) {
			actionTaken = true;
        });
		
		//case1
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
		expect(case1SingleNode).toBe(true);
		expect(case1LinkedToAnotherNode).toBe(false);
		expect(case1LinkedToPreviousNode).toBe(false);
    });
	
	it('should NOT appear on the history map. | Testing: Edge, No New Edge', function() {
		expect(case2SingleNode).toBe(true);
		expect(case2LinkedToAnotherNode).toBe(false);
		expect(case2LinkedToPreviousNode).toBe(false);
    });
});