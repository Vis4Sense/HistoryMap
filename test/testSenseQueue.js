/**
 * Created by steve on 9/6/16.
 */
describe('SenseQueue', () => {
    const URL1 = 'https://en.wikipedia.org/1';
    var node1 = new SenseNode(URL1, 'title1', 'type1', 'favIconUrl1', nodeIterator),
        node2 = new SenseNode('https://en.wikipedia.org/2', 'title2', 'type2', 'favIconUrl2', nodeIterator),
        node3 = new SenseNode('https://en.wikipedia.org/3', 'title3', 'type3', 'favIconUrl3', nodeIterator),
        node = new SenseNode('https://en.wikipedia.org/4', 'title4', 'type4', 'favIconUrl4', nodeIterator),
        senseQueue, error;

    try {
        senseQueue = new SenseQueue();
    } catch (e) {
        error = e;
    }

    it('Checking an exemplar of the SenseQueue Class', () => {
        assert.isDefined(senseQueue);
    });

    if (error) {
        return;
    }

    senseQueue.putQueue(node1); senseQueue.putQueue(node2); senseQueue.putQueue(node3);
    senseQueue.putQueue(new SenseNode('http://www.google.com', 'Google', 'link', 'favIconUrl5', nodeIterator));

    it('Checking length of the queue. Must be equal 4', () => {
        assert.equal(senseQueue.queue.length, 4);
    });

    it('Checking number of the first node', () => {
        assert.equal(senseQueue.findNodeByURL(URL1), 3);
    });

    it('Checking unique number generator of the SenseNodeIterator', () => {
        var nodeIds = senseQueue.queue.map(node => node.id),
            unique = nodeIds.filter((node, idx, self) => self.indexOf(node) == idx);
        assert.equal(senseQueue.queue.length, unique.length);
    });

    it('Checking that the second node is in the queue', () => {
        assert.isTrue(senseQueue.isInQueue(node2));
    });

    it('Check if the first node has corresponding number', () => {
        assert.equal(senseQueue.getNumberInQueue(node1), 3);
    });

    it('Check if the second node has corresponding number', () => {
        assert.equal(senseQueue.getNumberInQueue(node2), 2);
    });

    it('Check if the third node has has corresponding number', () => {
        assert.equal(senseQueue.getNumberInQueue(node3), 1);
    });

    it('Check a node which is not in queue has the null number', () => {
        assert.isNull(senseQueue.getNumberInQueue(node));
    });

    // console.log(senseQueue);
});
