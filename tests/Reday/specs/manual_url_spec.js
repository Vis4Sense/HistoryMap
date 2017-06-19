//Made by Reday Yayha | @RedayY
//Sensemap Jasmine Testing Specification Document
//Unit Testing for New Nodes

/*
Notes:
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
        browser = sm.provenance.browser()
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
    });
});