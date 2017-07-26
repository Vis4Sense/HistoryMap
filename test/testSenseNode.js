// import { SenseNode } from '../src/js/classes/senseNode';
/**
 * Created by steve on 8/31/16.
 */
describe('SenseNode', () => {
    var parent = new SenseNode(wikipediaUrl, 'Wikipedia', 'link', wikipediaUrl + 'favicon.ico', nodeIterator),
        child, slave, slave2, parent2;

    it('Checking unique number generator of the SenseNodeIterator', () => {
        var queue = [parent, child, slave, slave2, parent2],
            nodeIds = queue.map(node => node.id),
            unique = nodeIds.filter((node, idx, self) => self.indexOf(node) == idx);
        assert.equal(queue.length, unique.length);
    });

    it('Node returns the title Wikipedia', () => {
        // console.log(sURL);
        assert.equal(parent.title, 'Wikipedia');
    });

    it('Check if this node is active', () => {
        assert.isFalse(parent.highlighted);
    });

    it('Check favIconUrl is exist', () => {
        assert.isDefined(parent.favIconUrl);
    });

    child = new SenseNode('https://www.google.com', 'Google', 'link', undefined, nodeIterator);
    slave = new SenseNode('http://www.yahoo.com', 'Yahoo', 'type', '', nodeIterator);
    slave2 = new SenseNode('https://www.yahoo.com', 'Yahoo(2)', 'link', '', nodeIterator);
    parent2 = new SenseNode(
        'https://duckduckgo.com/', 'DuckDuckGo', 'link', 'https://duckduckgo.com/favicon.ico', nodeIterator
    );

    it('Checks if this node is already visited', () => {
        assert.isFalse(parent._seen);
    });

    it('SenseNode.time is defined', () => {
        assert.isDefined(parent.time);
    });

    it('Set SensNode keeper', () => {
        var expectError;
        try {
            child.keeper = parent;
        } catch (e) {
            expectError = e;
        }
        assert.isUndefined(expectError);
    });

    it('Test SensNode keeper', () => {
        assert.isObject(child.keeper);
    });

    it('Set SensNode nested', () => {
        var expectError;

        try {
            parent.nested = child;
        } catch (e) {
            expectError = e;
        }

        assert.isDefined(expectError);
    });

    it('Check if child.favIconUrl is not defined', () => {
        assert.isUndefined(child.favIconUrl);
    });

    slave.leader = parent;
    slave2.leader = parent;
    var testValue = parent.slaves.length;
    it('Check links: calculate number of the slaves', () => {
        assert.equal(testValue, 2);
    });

    var testValue2 = [parent.id, slave.leader.id];
    it('Check links: compare parent.id and slave.leader.id', () => {
        assert.equal(testValue2[0], testValue2[1]);
    });

    var testValue3 = [parent.slaves[0].id, slave.id];
    it('Check links: compare parent.slaves[0].id and slave.id', () => {
        assert.equal(testValue3[0], testValue3[1]);
    });

    var testValue4 = [parent.slaves[1].id, slave2.id];
    it('Check links: compare parent.slaves[1].id and slave2.id', () => {
        assert.equal(testValue4[0], testValue4[1]);
    });

    it('Check links: check forbid setting the field slave by manual, i.e. parent.slaves = [node] must be a error', () => {
        var expectError;

        try {
            parent.slaves = [parent2];
        } catch (e) {
            expectError = e;
        }

        assert.isDefined(expectError);
    });

    slave.leader = parent2;
    var testValue4 = parent.slaves.length;
    it('Check links: checking setting to another parent', () => {
        assert.equal(testValue4, 1);
    });
    // Prepare tree to check relations leader <-> slave
    var tree = [new SenseNode(parentSlaveLinks, 'title 0', 'type', parentSlaveLinks + 'favicon.ico', nodeIterator)];
    for (var i = 1; i <= 2; i++) {
        for (var j = 1; j <= 5; j++) {
            tree.push(new SenseNode(parentSlaveLinks + i + j, 'title ' + i + j, 'type', parentSlaveLinks + 'favicon.ico', nodeIterator));
        }
    }
    for (var i = 1; i <= 10; i++) {
        tree[i].leader = tree[i < 6 ? 0 : 3];
    }
    var lengthBeforeRearange = [tree[0].slaves.length, tree[3].slaves.length];

    it('Init and check number of slaves for the var tree[0]. It should be 5.', () => {
        assert.equal(lengthBeforeRearange[0], 5);
    });

    it('Init and check number of slaves for the var tree[3]. It should be 5.', () => {
        assert.equal(lengthBeforeRearange[1], 5);
    });
    // Rearrange tree to check relations leader <-> slave
    for (var i = 6; i <= 10; i++) {
        tree[i].leader = tree[0];
    }
    var lengthAfterRearange = [tree[0].slaves.length, tree[3].slaves.length];

    it('Rearrange and check number of slaves for the var tree[0]. It should be 10.', () => {
        assert.equal(lengthAfterRearange[0], 10);
    });

    it('Rearrange and check number of slaves for the var tree[3]. It should be 0.', () => {
        assert.equal(lengthAfterRearange[1], 0);
    });

    // Add 2 highlights to the parent2 node
    tree = tree.concat(slave, parent2,
        new SenseHighlight(parent2, {text: 'test', classId: 'B', path: 'parent2->B'}),
        new SenseHighlight(parent2, {text: 'test', type: 'filter'})
    );

    describe('Export/Import', () => {
        const TOTAL = 15;
        var exportTree = tree.map(obj => obj.export), newTree = [];

        it('Check export operation', () => {
            assert.equal(exportTree.length, TOTAL);
        });

        it('Check the first exported url to having 10 slaves', () => {
            assert.equal(exportTree[0]._export.slaves.length, 10);
        });

        it('Check the twelfth element which has 2 nested objects', () => {
            assert.equal(exportTree[12]._export.nested.length, 2);
        });

        exportTree.forEach(data => {
            var newObject;
            if (SenseHighlight.isOwnType(data.type)) {
                newObject = new SenseHighlight();
            } else {
                newObject = new SenseNode();
            }
            newObject.export = data;
            newTree.push(newObject);
        });

        it('Check import operation', () => {
            assert.equal(newTree.length, TOTAL);
        });

        SenseNode.fixImport(newTree);

        tree.forEach((url, idx) => {
            it('Check equivalence of the element number ' + idx, () => {
                assert.isTrue(url.isEqual(newTree[idx]));
            });
        });
        // console.info(tree, newTree);
    });
});
