describe("browser provenance", function () {

    // const browserProv;

    // beforeEach (function() {
    //     browserProv = historymap.controller.provenance.brower();
    // });
    
    it('the count should be 0', function() {
        var browserProv = historymap.controller.provenance.browser();
        chrome.tabs.update.sendmessage('dataChanged');
        expect(browserProv).toBe(0);
    });
})