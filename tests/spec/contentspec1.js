describe("This is too test our chrome extension: ", function() {
  var a;

  it("and so is a spec", function() {
    a = true;

    expect(a).toBe(true);
  });
});

describe('Content Spec', function() {
	var a = new content();
	// var b = new injectLinks();
	it('should be able to run the add function', function() {
	// 		expect(true).toBe(true);
		expect(a.add(2,3)).toBe(5);
	});
});


//THus code not working yet
// describe("background", function(){
//   beforeEach(function(){
//     chrome = {
//       runtime: {
//         sendMessage: function(){}
//         }
//       }
     
//     // spyOn(document,'addEventlistener');
//     spyOn(chrome.runtime,'sendMessage');
// });
//   describe("contentjs", function(){
//   	it("should send a background opened message", function(){
//   		runs
//   		runs(sendClick());
//   		expect(chrome.runtinme.sendMessage).toHaveBeenCalledWith({ type: "linkClicked" });
//   	});
//   });
// });
    // it('should be able to call runtime')