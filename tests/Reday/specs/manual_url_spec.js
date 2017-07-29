//Made by Reday Yahya | @RedayY
//Sensemap Jasmine Testing Specification Document
//Unit Testing for New Nodes

/*
Notes:

We can detect AJAX and let our Expansion do something

$(document).ajaxStart(function() { STUFF HERE });

$(document).ajaxStop(function() {  STUFF HERE  });

How would this help with pages refreshing?
-Use the start indicator to trigger refresh of given node
-Update history map

*/


describe('Unit Testing Suit for New Node Creation', function () {

        //4 Tests
        let standard_link_check = false;
        let https_link_check = false;
        let no_domain_link = false;
        let weirdo_link_check = false;
                
        //making sure pages loaded to test
        let tab_1_loaded = false;
        let tab_2_loaded = false;
        let tab_3_loaded = false;
        let tab_4_loaded = false;

        //async callback
        let pages_loaded = false;


    beforeAll(function(done) {

        var standard_link = "http://www.mdx.ac.uk/";
        var no_dom_link = "http://bing/";
        var secure_link = "https://google.com/";
        var weirdo_link = "http://sdjfrwerlwkejrljkwerlkjwe/";

        //calling sensemap browser.provenance
        browser = sm.provenance.browser()
            .on('nodeCreated', function(node) {

                //checks if URL "Manual Entered Simulation" matches the Object Action URL
                if (node.url === standard_link ) {
                    standard_link_check = true;
                };

                if (node.url === no_dom_link ) {
                    no_domain_link = true;
                };

                if (node.url === secure_link ) {
                    https_link_check = true;
                };

                if (node.url === weirdo_link ) {
                    weirdo_link_check = true;
                };

            });
            


            // small cheat to Load in sequence to bypass Async limitation
                    chrome.tabs.create({ url: standard_link, active: false }, function(tab) {
                    chrome.tabs.executeScript(tab.id, { code: `` }, function() {
                     tab_1_loaded = true;
                    if (tab_1_loaded == true){
                        
                        chrome.tabs.create({ url: no_dom_link, active: false }, function(tab) {
                        tab_2_loaded = true;
                        if(tab_2_loaded == true){

                            chrome.tabs.create({ url: secure_link, active: false }, function(tab) {
                                chrome.tabs.executeScript(tab.id, { code: ``}, function(){
                            tab_3_loaded = true;
                            if(tab_3_loaded == true){
                            
                                chrome.tabs.create({ url: weirdo_link, active: false }, function(tab) {
                                tab_4_loaded = true;
                                if(tab_4_loaded == true){
                                    done();
                        }
                    });
                        }})
                    });
                        }
                    });

                    }
            });
        });
    });


it('It should accept and create a node. | Testing: Node Creation, Matching URL', function() {
    expect(standard_link_check).toBeTruthy();
    });


it('It should create a Node without domain | Testing: Node Creation, no domain URL', function() {
    expect(no_domain_link).toBeTruthy();
    });


it('It should create a node when using https | Testing: Node Creation, secure URL', function() {
    expect(https_link_check).toBeTruthy();
    });


it('It should create a new node even with weird URLs. | Testing: Node Creation, weirdo URL', function() {
    expect(weirdo_link_check).toBeTruthy();
    });
});