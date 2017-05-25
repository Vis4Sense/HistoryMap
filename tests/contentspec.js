describe("This is to test that Jasmine is working", function() {
  var a;

  it("A spec not using SenseMap", function() {
    a = true;

    expect(a).toBe(true);
  });
});

describe('this is my looping test!', function() {
  var input = [1,2,3];
  var output = [10, 20, 30];

  function test_my_times_ten(input, output) {
    it('should multiply ' + input + ' by 10 to give ' + output, function() {
      expect(input * 10).toEqual(output)
    });
  }

  for(var x = 0; x < input.length; x++) {
    test_my_times_ten(input[x], output[x]);
  }
});

describe("history map functionality: ", function(){

	// spyOn(sm.vis, "historyMap");
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
      spyOn(sm.provenance,'browser').and.callThrough();

    });
 	 
    it('SenseMap host URL', function(){
      expect(sm.host).toEqual("http://bigdata.mdx.ac.uk/");
      expect(true).toBe(true);
      // expect(sm.provenance.browser.saveLastClickedUrl).toHaveBeenCalled();
    });

    var lastClickedUrl = [];
    var urls = []
    // it('should call linked each time', function(){
      	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.type === 'linkClicked') {
                console.log(sender.tab.url)
                console.log(sm.provenance.browser.lastClickedUrl)
                console.log("hello")
                lastClickedUrl.push(sm.provenance.browser.lastClickedUrl);
                urls.push(sender.tab.url)
                console.log(lastClickedUrl)
                console.log(urls)
            //     describe("blah blah blah ", function(){
            //      it('should call time', function(){

            //     expect(sm.provence.browser.lastClickedUrl).toBe(sender.tab.url);
            // });
            //  });
                }
        });

    	describe("nested describe", function(){
    		beforeEach(function(done) {
    setTimeout(function() {
        value = 0;
        done();
    }, 10000);
});

    		function test_my_last_clicked(lastClickedUrl, urls) {
    it('should multiply ' + lastClickedUrl + ' by 10 to give ' + urls, function() {
      expect(lastClickedUrl * 10).toEqual(urls)
    });
  }

  for(var x = 0; x < lastClickedUrl.length; x++) {
    test_my_last_clicked(lastClickedUrl[x], urls[x]);
  }
    	})    
    });

