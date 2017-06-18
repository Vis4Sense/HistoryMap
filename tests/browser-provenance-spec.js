// require(['sinon-chrome'], function(chrome){
// 'use strict';
// import chrome from 'node_modules/sinon-chrome/bundle';
describe("browser provenance", function () {

    // const browserProv;

    // beforeEach (function() {
    //     browserProv = sm.provenance.brower();
    // });
    
    it('the count should be 0', function() {
        var browserProv = sm.provenance.browser();
        chrome.tabs.update.sendmessage('dataChanged');
        expect(browserProv).toBe(0);
    });

})
// });