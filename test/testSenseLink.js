// import { SenseNode } from '../src/js/classes/senseNode';
// import { SenseLink } from '../src/js/classes/senseLink';
describe('SenseLink', () => {
    var node1 = new SenseNode('https://en.wikipedia.org/1', 'title1', 'type1', 'favIconUrl1', nodeIterator),
        node2 = new SenseNode('https://en.wikipedia.org/2', 'title2', 'type2', 'favIconUrl2', nodeIterator),
        sLink,
        error;

    try {
        sLink = new SenseLink(node1, node2, 'Test link');
    } catch (e) {
        error = e;
    }

    if (error) {
        it('can\'t find SenseLink Class', () => {
            assert.isDefined(sLink);
        });
    } else {
        it('SenseLink is defined Class', () => {
            assert.isDefined(sLink);
        });

        it('SenseLink object is object', () => {
            assert.isObject(sLink);
        });

        // FIELDS
        it('title is defined', () => {
            assert.isDefined(sLink.title);
        });

        it('title is String', () => {
            assert.isString(sLink.title);
        });

        it('srcNode is defined', () => {
            assert.isDefined(sLink.srcNode);
        });

        it('dstNode is defined', () => {
            assert.isDefined(sLink.dstNode);
        });

        it('srcNode is an instance of SenseNode', () => {
            var isInstance = sLink.srcNode instanceof SenseNode;
            assert.isTrue(isInstance);
        });

        it('dstNode is an instance of SenseNode', () => {
            var isInstance = sLink.dstNode instanceof SenseNode;
            assert.isTrue(isInstance);
        });

        it('place is defined', () => {
            assert.isDefined(sLink.place);
        });

        it('place is object', () => {
            assert.isObject(sLink.place);
        });
        /*
        it('place.onHistory is defined', () => {
            assert.isDefined(sLink.place.onHistory);
        });

        it('place.onHistory is object', () => {
            assert.isObject(sLink.place.onHistory);
        });

        it('place.onHarvest is defined', () => {
            assert.isDefined(sLink.place.onHarvest);
        });

        it('place.onHarvest is object', () => {
            assert.isObject(sLink.place.onHarvest);
        });

        // METHODS
        it('setTitle is defined', () => {
            assert.isDefined(sLink.setTitle);
        });

        it('setTitle is function', () => {
            assert.isFunction(sLink.setTitle);
        });

        it('setTitle is working', () => {
            var title = 'title';
            sLink.setTitle(title);
            assert.isEqual(sLink.title, title);
        });

        it('drawOnHistory(x, y) is defined', () => {
            assert.isDefined(sLink.drawOnHistory);
        });

        it('drawOnHistory(x, y) is function', () => {
            assert.isFunction(sLink.drawOnHistory);
        });

        it('drawOnHarvest(x, y) is defined', () => {
            assert.isDefined(sLink.drawOnHarvest);
        });

        it('drawOnHarvest(x, y) is function', () => {
            assert.isFunction(sLink.drawOnHarvest);
        });

        it('cutFromHistory() is defined', () => {
            assert.isDefined(sLink.cutFromHistory);
        });

        it('cutFromHistory() is function', () => {
            assert.isFunction(sLink.cutFromHistory);
        });

        it('cutFromHarvest() is defined', () => {
            assert.isDefined(sLink.cutFromHarvest);
        });

        it('cutFromHarvest() is function', () => {
            assert.isFunction(sLink.cutFromHarvest);
        });
        */
        it('destroyItself is defined', () => {
            assert.isDefined(sLink.destroyItself);
        });

        it('destroyItself is function', () => {
            assert.isFunction(sLink.destroyItself);
        });

        it('destroyItself is working', () => {
            sLink.destroyItself();
            var check = sLink.srcNode === undefined && sLink.dstNode === undefined;
            assert.isTrue(check);
        });
    }
});
