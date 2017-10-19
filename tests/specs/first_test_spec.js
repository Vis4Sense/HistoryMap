describe("This is to test that Jasmine is working", function() {
  var a;

  it("A spec not using SenseMap", function() {
    a = true;

    expect(a).toBe(true);
  });
});


describe("history map functionality: ", function(){

	// spyOn(historyMap.view.vis, "historyMap");
	beforeEach(function(){
      chrome = {
        runtime: {
          onMessage: {

            addListener: function(request, sender, sendResponse){}
          
          }
        }
      //   browserAction: {
      //     onClicked: {
      //    addListener: function(){}
      //  }
      // }
      }
      spyOn(historymap.controller.provenance,'browser').and.callThrough();

    });
 	 
    it('SenseMap host URL', function(){
      expect(historyMap.host).toEqual("http://bigdata.mdx.ac.uk/");
      expect(true).toBe(true);
      // expect(historymap.controller.provenance.browser.saveLastClickedUrl).toHaveBeenCalled();
    });

    it('should call linked each time', function(){
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.type === 'linkClicked') {
                console.log(sender.tab.url)
                console.log("hello")
                    it('should call time', function(){

                expect(historyMap.provence.browser.lastClickedUrl).toBe(sender.tab.url);
            });
                }
        });
    });
	});
