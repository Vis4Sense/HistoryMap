/**
 * Created by steve on 9/29/16.
 */
describe('SenseTransaction', () => {
    const SRC_URL = 'https://www.google.com',
        DST_URL = 'https://uk.wikipedia.org';
    var senseTransaction, error,
        srcNode = new SenseNode(SRC_URL, 'title of the source', 'srcType', 'favIconUrl1', nodeIterator),
        dstNode = new SenseNode(DST_URL, 'title of the destination', 'dstType', 'favIconUrl2', nodeIterator),
        srcTab = {url: SRC_URL, tabId: 1, windowId: 1},
        dstTab = {url: DST_URL, tabId: 2, windowId: 1},
        number, foundNumber, found = false;

    try {
        senseTransaction = new SenseTransaction();
    } catch (e) {
        error = e;
    }

    it('Checking an exemplar of the SenseTransaction Class', () => {
        assert.isDefined(senseTransaction);
    });

    if (error) {
        return;
    }

    number = senseTransaction.start(srcTab, dstTab, srcNode);

    it('Start a transaction. The number should be defined', () => {
        assert.isNumber(number);
    });

    it('Start a transaction and check the number. It\'s should not be equal -1', () => {
        assert.notEqual(number, -1);
    });

    foundNumber = senseTransaction.lookup(srcTab, true);
    it('Lookup the transaction by the source tab and check the found number is equal 0', () => {
        assert.strictEqual(foundNumber, 0);
    });

    foundNumber = senseTransaction.lookup(dstTab, false);
    it('Lookup the transaction by the destination tab and check the found number is equal 0', () => {
        assert.strictEqual(foundNumber, 0);
    });
    // Prepare the destination node to finish the transaction
    dstNode.tabId = dstTab.tabId; dstNode.windowId = dstTab.windowId;
    found = senseTransaction.finish(dstNode);

    it('Check the found transaction. It should be true', () => {
        assert.isTrue(found);
    });

    it('Check the list of the transactions. It should be 0', () => {
        assert.strictEqual(senseTransaction.transactions.length, 0);
    });
});
