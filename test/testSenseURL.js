// import '../src/js/classes/senseUrl';
/**
 * Created by steve on 8/8/16.
 */
const wikipediaUrl = 'https://en.wikipedia.org/wiki/Structured_systems_analysis_and_design_method',
    sonyUrl = 'http://www.sony.com/search?query=xperia&locale=en_US',
    sonyFiltered = 'http://www.sony.com/search?query=xperia&locale=en_US&filter=entertainment',
    parentSlaveLinks = 'http://www.link.com/';

var assert = chai.assert,
    nodeIterator = senseNodeIterator();

describe('SenseURL', () => {
    const sonyString = 'SenseURL.extractUserAction ',
        sonyFullString = sonyString + 'on the urls: ' + sonyUrl + ' and ' + sonyFiltered;
    var sURL = new SenseURL(wikipediaUrl, 'Wikipedia', '', nodeIterator.next().value),
        searchURL = 'https://www.google.com/search?q=search&rct=j',
        filter = SenseURL.extractUserAction(sonyUrl, sonyFiltered),
        child = new SenseURL(searchURL, 'Google');

    child.keeper = sURL;

    it('SenseURL returns the title Wikipedia', () => {
        // console.log(sURL);
        assert.equal(sURL.title, 'Wikipedia');
    });

    it('Check setting of a new title', () => {
        const newTitle = 'Wikipedia(Stage)';
        sURL.title = newTitle;
        assert.equal(sURL.title, newTitle);
    });

    it('SenseURL.isSameURL should be boolean', () => {
        // Assert that the width can be changed.
        assert.isBoolean(sURL.isSameURL(wikipediaUrl + '#Stage_0_.E2.80.93_Feasibility_study'));
    });

    it('SenseURL.isSameURL should be true', () => {
        // Assert that the width can be changed.
        assert.isTrue(sURL.isSameURL(wikipediaUrl + '#Stage_0_.E2.80.93_Feasibility_study'));
    });

    it('SenseURL.isEqual should be boolean', () => {
        assert.isBoolean(sURL.isEqual(sURL));
    });

    it('SenseURL.isEqual should be true', () => {
        assert.isTrue(sURL.isEqual(sURL));
    });

    it('SenseURL.isSearchEngine check search engine', () => {
        // Assert that an error will be thrown if
        // the width it set to a non-numerical value.
        assert.isFalse(sURL.isSearchEngine);
    });

    it('searchURL is ' + searchURL + '. Search engine is true', () => {
        child.isSearchEngine = !!SenseURL.detectSearchEngine(child.url);
        // the width it set to a non-numerical value.
        assert.isTrue(child.isSearchEngine);
    });

    it('SenseURL.time is defined', () => {
        assert.isDefined(sURL.time);
    });

    it('SenseURL.id is exist', () => {
        assert.isDefined(sURL.id);
    });

    it('child.id is not defined', () => {
        assert.isUndefined(child.id);
    });

    it('SenseURL.toSave() is exist and it is a function', () => {
        assert.isObject(sURL.export);
    });

    it('SenseURL has defined links', () => {
        assert.isDefined(sURL.slaves);
    });

    it('Parent SenseURL has defined children', () => {
        assert.isDefined(sURL.nested);
    });

    it('Parent SenseURL has one child', () => {
        assert.equal(sURL.nested.length, 1);
    });

    it(sonyFullString, () => {
        assert.isObject(filter);
    });

    it(sonyString + ' should be a filter', () => {
        assert.equal(filter.type, 'filter');
    });

    // Prepare tree to check relations leader <-> slave
    var tree = [new SenseURL(parentSlaveLinks, 'title 0', nodeIterator.next().value)];
    for (var i = 1; i <= 2; i++) {
        for (var j = 1; j <= 3; j++) {
            tree.push(new SenseURL(
                parentSlaveLinks + i + j, 'title ' + i + j, nodeIterator.next().value
            ));
        }
    }
    for (var i = 1; i <= 6; i++) {
        tree[i].leader = tree[i < 4 ? 0 : 3];
    }
    var lengthBeforeRearange = [tree[0].slaves.length, tree[3].slaves.length];

    it('Init and check number of slaves for the var tree[0]. It should be 3.', () => {
        assert.equal(lengthBeforeRearange[0], 3);
    });

    it('Init and check number of slaves for the var tree[3]. It should be 3.', () => {
        assert.equal(lengthBeforeRearange[1], 3);
    });
    // Rearrange tree to check relations leader <-> slave
    for (var i = 4; i <= 6; i++) {
        tree[i].leader = tree[0];
    }
    var lengthAfterRearange = [tree[0].slaves.length, tree[3].slaves.length];

    it('Rearrange and check number of slaves for the var tree[0]. It should be 6.', () => {
        assert.equal(lengthAfterRearange[0], 6);
    });

    it('Rearrange and check number of slaves for the var tree[3]. It should be 0.', () => {
        assert.equal(lengthAfterRearange[1], 0);
    });

    describe('Export/Import', () => {
        var exportTree = tree.map(url => url.export), newTree = [];

        it('Check an export operation', () => {
            assert.equal(exportTree.length, 7);
        });

        it('Check the first exported url to having 6 slaves', () => {
            assert.equal(exportTree[0]._export.slaves.length, 6);
        });

        exportTree.forEach(data => {
            var newObject = new SenseURL('http://test.incorrect.com');
            newObject.export = data;
            newTree.push(newObject);
        });

        it('Check import operation', () => {
            assert.equal(newTree.length, 7);
        });

        // Here we need to set leader and keeper for every node in newTree array
        SenseURL.fixImport(newTree);

        tree.forEach((url, idx) => {
            it('Check equivalence of the element number ' + idx, () => {
                assert.isTrue(url.isEqual(newTree[idx]));
            });
        });
        // console.info(tree, newTree);
    });
});
