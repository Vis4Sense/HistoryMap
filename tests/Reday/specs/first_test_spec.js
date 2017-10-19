describe("SenseMap Testing Suite ", function(){
let Statement_case = false;

	beforeEach(function(){

    
  var iconurl = "https://www.thefreecountry.com/favicon.ico";
  var website_url = "https://www.thefreecountry.com/";s

    //logic: whenever something happend on the history map do something
        browser = historymap.controller.provenance.browser()
            .on('dataChanged', function(action) {
              
               if(action.favIconUrl === iconurl) {
                 Statement_Case = true;
               }
            }),


    //Open and create the chrome tab so sensemap can act
        chrome.tabs.create({ url: iconurl, active: false }, function(tab) {
            
            //trying to log favIconUrl
             chrome.tabs.executeScript(tab.id, function() {
                console.log(tab.favIconUrl);
            });

        });
  });


    });
 	 
    it('Chamber 1', function(){
      expect(Statement_Case).toBeTruthy();
    });
