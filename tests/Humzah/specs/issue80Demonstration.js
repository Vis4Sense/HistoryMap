describe("Node and Edge", function () {
	let singleNode = false;
	var actionTaken = false;
	var numberOfNodes = 0;
	var numberOfEdges = 0;
    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/';
        var nodes = []; // All actions added in temporal order

        browser = sm.provenance.browser()
            .on('nodeCreated', function(node) {
				nodes.push(node) ;
				
				if(actionTaken) {
					console.log("Expected number of nodes: 1");
					console.log("Actual number of nodes: " + nodes.length);
					numberOfNodes = nodes.length;
					console.log(JSON.stringify(nodes, null, 2));
					done();
				}
				
				for (i = 0; i < numberOfNodes; i++) {
					if (nodes[i].from !== undefined) {
						numberOfEdges+=1;
					}
				}
            });
			
        chrome.tabs.create({ url: manualUrl, active: false }, function(tab) {
			actionTaken = true;
        });
    });
	
	it('only one node should appear on the history map. | Testing: Number of Nodes', function() {
		expect(numberOfNodes).toBe(1);
    });
	
	
	it('no edges should appear on the history map. | Testing: Number of Edges', function() {
		expect(numberOfEdges).toBe(0);
    });
});