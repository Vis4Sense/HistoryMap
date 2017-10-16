describe("Edge", function () {
    let case1SingleNode = false,
		case1LinkedToAnotherNode = false,
		case1LinkedToPreviousNode = false;
		
    let case2SingleNode = false,
		case2LinkedToAnotherNode = false,
		case2LinkedToPreviousNode = false;
		
	let case3RelatedSingleNode = false,
		case3RelatedLinkedToAnotherNode = false,
		case3RelatedLinkedToPreviousNode = false;

	let case3UnrelatedSingleNode = false,
		case3UnrelatedLinkedToAnotherNode = false,
		case3UnrelatedLinkedToPreviousNode = false;
		
	var case3RelatedComplete = false,
		case3UnrelatedComplete = false;
		
		

    beforeAll(function(done) {
        const manualUrl = 'http://www.mdx.ac.uk/',
			  linkUrl = 'http://www.mdx.ac.uk/our-research', // Still need to copy this string in content script
			  altUrl = 'http://www.google.co.uk';
			
        let linkClicked = false,
			actionTaken = false;
		
		let case1Complete = false;
		//flag to make sure case2 is complete before testing case1
		let case2Complete = false;
		
        var nodes = []; // All actions added in temporal order

        browser = sm.provenance.browser()
            .on('nodeCreated', function(node) {
				nodes.push(node) ;
				var firstNode = nodes[0];
				var secondNode = nodes[1];
				//thirdNode -> relatedNode
				//fourthNode -> unrelatedNode
				var thirdNode = nodes[0];
				var fourthNode = nodes[1];
				var relatedNode = nodes[2];
				var unrelatedNode = nodes[3];
				
				console.log("NODES" + JSON.stringify(nodes, null, 2));
				// Call done() when required pages are loaded and ready to run the assertions
				if (linkClicked && case2Complete) {
					case1SingleNode = (firstNode == lastNode);
					case1LinkedToAnotherNode = (lastNode.from != undefined);
					case1LinkedToPreviousNode = (lastNode.from == firstNode.id);
					console.log(case1SingleNode + " " + case1LinkedToAnotherNode + " " + case1LinkedToPreviousNode);
					case1Complete = true;
					//done();
				}
				
                if (actionTaken) {
					case2SingleNode = (firstNode == lastNode);
					case2LinkedToAnotherNode = (lastNode.from != undefined);
					case2LinkedToPreviousNode = (lastNode.from == firstNode.id);
					console.log(case2SingleNode + " " + case2LinkedToAnotherNode + " " + case2LinkedToPreviousNode);
					case2Complete = true;
					//done();
				}

                if (createdRelatedUrl) {
					case3RelatedSingleNode = (thirdNodeNode == relatedNode);
					case3RelatedLinkedToAnotherNode = (relatedNode.from != undefined);
					case3RelatedLinkedToPreviousNode = (relatedNode.from == thirdNode.id);
					case3RelatedComplete = true;
				}
				
				 if (createdUnrelatedUrl) {
					case3UnrelatedSingleNode = (fourthNode == unrelatedNode);
					case3UnrelatedLinkedToAnotherNode = (unrelatedNode.from != undefined);
					case3UnrelatedLinkedToPreviousNode = (unrelatedNode.from == fourthNode.id);
					case3UnrelatedComplete = true;
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
		
		//case 3 (related and unrelated)
		chrome.tabs.create({ url: manualUrl, active: false }, function(tab) {
            // Simulate change of url (new url is related to the previous page) 
           	chrome.tabs.update(tab.id, {url: linkUrl}, function() {
				createdRelatedUrl = true;
			});
        });
		chrome.tabs.create({ url: 'http://www.google.co.uk/', active: false }, function(tab) {
            // Simulate change of url (new url is related to the previous page) 
           	chrome.tabs.update(tab.id, {url: 'http://www.reddit.co.uk/'}, function() {
				createdUnrelatedUrl = true;
			});
        });
    });
	
	it('should appear on the history map. | Testing: Edge, New Edge (Link clicked)', function() {
		//there should be atleast two nodes, the childnode should be linked to the parent/another node (edge)
		expect(case1SingleNode).toBe(true);
		expect(case1LinkedToAnotherNode).toBe(false);
		expect(case1LinkedToPreviousNode).toBe(false);
    });
	
	it('should NOT appear on the history map. | Testing: Edge, No New Edge', function() {
		//there should be one node, the node should not be linked to any another node (no edge)
		expect(case2SingleNode).toBe(true);
		expect(case2LinkedToAnotherNode).toBe(false);
		expect(case2LinkedToPreviousNode).toBe(false);
    });
	it('should appear on the history map. | Testing: Edge, Unclear (Related URL)', function() {
		//there should be atleast two nodes, the childnode should be linked to the parent/another node (edge)
		expect(case3RelatedSingleNode).toBe(false);
		expect(case3RelatedLinkedToAnotherNode).toBe(true);
		expect(case3RelatedLinkedToPreviousNode).toBe(true);
	});

	it('should NOT appear on the history map. | Testing: Edge, Unclear (Unrelated URL)', function() {
		//there should be atleast two nodes, the child node	should NOT be linked to the parent node/another node (no edge)
		expect(case3UnrelatedSingleNode).toBe(false);
		expect(case3UnrelatedLinkedToAnotherNode).toBe(false);
		expect(case3UnrelatedLinkedToPreviousNode).toBe(false);		
	});

	
});