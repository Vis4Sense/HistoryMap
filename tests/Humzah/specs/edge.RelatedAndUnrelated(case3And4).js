describe("Edge", function () {
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
			unrelatedUrl = 'https://stackoverflow.com/questions/1891738/how-to-modify-current-url-location-in-chrome-via-extensions/';
			
        let	createdRelatedUrl = false,
			createdUnrelatedUrl = false;
				
        var nodes = []; // All actions added in temporal order

        browser = sm.provenance.browser()
            .on('nodeCreated', function(node) {
				nodes.push(node) ;
				//firstNode -> relatedNode
				//secondNode -> unrelatedNode
				var firstNode = nodes[0];
				var secondNode = nodes[1];
				var relatedNode = nodes[2];
				var unrelatedNode = nodes[3];
				//Modifying the speed at which these alerts are dismissed(by pressing enter)
				//Gives a different number of nodes (printed in line 55), 
				//commenting out the alert below also gives a different number
				alert(createdRelatedUrl + " " + createdUnrelatedUrl);
				console.log("NODES" + JSON.stringify(nodes, null, 2));
				
                if (createdRelatedUrl) {
					case3RelatedSingleNode = (firstNode == relatedNode);
					case3RelatedLinkedToAnotherNode = (relatedNode.from != undefined);
					case3RelatedLinkedToPreviousNode = (relatedNode.from == firstNode.id);
					case3RelatedComplete = true;
				}
				
				 if (createdUnrelatedUrl) {
					case3UnrelatedSingleNode = (secondNode == unrelatedNode);
					case3UnrelatedLinkedToAnotherNode = (unrelatedNode.from != undefined);
					case3UnrelatedLinkedToPreviousNode = (unrelatedNode.from == firstNode.id);
					case3UnrelatedComplete = true;
				}
				
				// Call done() when required pages are loaded and ready to run the assertions
				if (case3RelatedComplete || case3UnrelatedComplete) {
					done();
					console.log("FINAL SET OF NODES" + JSON.stringify(nodes, null, 2));
				}
				
            });

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

		it('should appear on the history map. | Testing: Edge, Unclear (Related URL)', function() {
			//there should be atleast two nodes, the childnode should be linked to the parent/another node (edge)
			expect(case3RelatedSingleNode).toBe(false);
			expect(case3RelatedLinkedToAnotherNode).toBe(true);
			expect(case3RelatedLinkedToPreviousNode).toBe(true);
			//"Related url pass: f t t"
			console.log(case3RelatedSingleNode + " " + 
						case3RelatedLinkedToAnotherNode + " " + 
						case3RelatedLinkedToPreviousNode);
		});
		
		it('should NOT appear on the history map. | Testing: Edge, Unclear (Unrelated URL)', function() {
			//there should be atleast two nodes, the child node	should NOT be linked to the parent node/another node (no edge)
			expect(case3UnrelatedSingleNode).toBe(false);
			expect(case3UnrelatedLinkedToAnotherNode).toBe(false);
			expect(case3UnrelatedLinkedToPreviousNode).toBe(false);
			//"Unrelated url should pass at f f f"
			console.log(case3UnrelatedSingleNode + " " + 
						case3UnrelatedLinkedToAnotherNode + " " + 
						case3UnrelatedLinkedToPreviousNode);				
		});
});