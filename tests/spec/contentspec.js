describe("This is too test our chrome extension: ", function() {
  var a;

  it("and so is a spec", function() {
    a = true;

    expect(a).toBe(true);
  });
});


describe("history map functionality", function(){

	// spyOn(sm.vis, "historyMap");
	beforeEach(function(){
      chrome = {
        runtime: {
          onMessage: {

            addListener: function(request, sender, sendResponse){}
          
          }
        }
    //     browserAction: {
   //        onClicked: {
    //      addListener: function(){}
   //     }
      // }
      }
      spyOn(sm.provenance,'browser').and.callThrough();

    });
 	 
    it('should work this time! ', function(){
      expect(sm.host).toEqual("http://bigdata.mdx.ac.uk/");
      expect(true).toBe(true);
      // expect(sm.provenance.browser.saveLastClickedUrl).toHaveBeenCalled();
    });

    it('should call linked each time', function(){
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.type === 'linkClicked') {
                console.log(sender.tab.url)
                console.log("hello")
                    it('should call time', function(){

                expect(sm.provence.browser.lastClickedUrl).toBe(sender.tab.url);
            });
                }
        });
    });
	});
