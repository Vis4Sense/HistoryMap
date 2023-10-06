<<<<<<< HEAD
//Made by Reday Yayha | @RedayY
=======
//Made by Reday Yahya | @RedayY
>>>>>>> 03e6ba4afa8836a0083c5d88b7efcdc52cb58922
//Sensemap Jasmine Testing Specification Document
//Unit Testing for New Nodes

/*
Notes:
<<<<<<< HEAD
Constantly refreshing with a really fast machine can trigger code to go "false"


*/


describe('User enters URL manually', function () {

        //test variable
        let user_link_node_created = false;

    beforeAll(function(done) {

        //Array of URLS (sort of simulates user typing in a random URL)
        var URL_array = ["https://www.google.de/", "http://www.msn.com/en-gb", "http://www.mdx.ac.uk/", "http://aksjkdalskjflkssadjf/"];

        //"aksjkdalskjflkssadjf" - is used incase the user decides to smash something against his keyboard
        //var test_url = "http://www.mdx.ac.uk/"
        
        //takes a url everytime the testing suite gets loaded
        var no_gen = Math.floor((Math.random() * URL_array.length) + 0);

        //debug
        //console.log(no_gen);

        //selecting a random URL from my Array of URLS (Testing with some rules)
        var user_link = URL_array[no_gen];
        //console.log(user_link);

        //calling sensemap browser.provenance
        browser = historymap.controller.provenance.browser()
            .on('dataChanged', function(action) {

                //debug
                //console.log(action.url, user_link);
                //if (action.url === user_link){ console.log("ITS WORKING")};

                //checks if URL "Manual Entered Simulation" matches the Object Action URL
                if (action.url === user_link) {

                    user_link_node_created = true, console.log("CHANGED");
                } 

                //Asynchronous Callback
                done();
            });
            
            //creates a chrome tab with the desired URL ID
            chrome.tabs.create({ url: user_link, active: false }, function(tab) {
        });

    });

it('should have created a node when a manual url is typed', function() {
    expect(user_link_node_created).toBeTruthy();
=======

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
        browser = historymap.controller.provenance.browser()
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
>>>>>>> 03e6ba4afa8836a0083c5d88b7efcdc52cb58922
    });
});