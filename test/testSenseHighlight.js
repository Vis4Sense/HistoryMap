/**
 * Created by steve on 8/26/16.
 */
describe('SenseHighlight', () => {
    var title = 'Title',
        sURL = new SenseURL(wikipediaUrl, 'Wikipedia', nodeIterator.next().value),
        senseHighlight = new SenseHighlight(sURL, {
            text: title, path: 'path', classId: 'A', type: 'highlight'
        }, nodeIterator),
        senseHighlight2 = new SenseHighlight(sURL, {
            text: title, path: undefined, classId: undefined, type: 'filter'
        }, nodeIterator), tree = [sURL, senseHighlight, senseHighlight2];

    it('Check initialisation of the SenseURL', () => {
        assert.isObject(sURL);
    });

    it('Check initialisation of the SenseHighlight', () => {
        assert.isObject(senseHighlight, 'it is not object');
    });

    it('Check initialisation of the SenseHighlight2', () => {
        assert.isObject(senseHighlight2, 'it is not object');
    });

    it('SenseHighlight text is defined', () => {
        assert.isDefined(senseHighlight.text);
    });

    it('SenseHighlight text is string', () => {
        assert.isString(senseHighlight.text);
    });

    it('SenseHighlight path is defined', () => {
        assert.isDefined(senseHighlight.path);
    });

    it('SenseHighlight path is string', () => {
        assert.isString(senseHighlight.path);
    });

    it('SenseHighlight senseURL is defined (Object)', () => {
        assert.isDefined(senseHighlight.keeper);
    });

    it('SenseHighlight senseURL equal SenseURL (Object)', () => {
        assert.equal(senseHighlight.keeper, sURL);
    });

    it('isSearch method is defined, it is a temporary method while the field type is exist', () => {
        assert.isDefined(senseHighlight.isSearch);
    });

    it('isSearch is "filter" is for the object senseHighlight', () => {
        assert.isFalse(senseHighlight.isSearch());
    });

    it('isSearch is "filter" is for the object senseHighlight2', () => {
        assert.isTrue(senseHighlight2.isSearch());
    });

    it('isEmbedded method is defined, it is a temporary method while the field type is exist', () => {
        assert.isDefined(senseHighlight.isEmbedded);
    });

    it('isEmbedded is type in "[highlight, note, filter]" and is for the object senseHighlight', () => {
        assert.isTrue(senseHighlight.isEmbedded());
    });

    it('isEmbedded is type in "[highlight, note, filter]" and is for the object senseHighlight2', () => {
        assert.isTrue(senseHighlight2.isEmbedded());
    });

    it('isRegistered method is defined, it is a temporary method while the field type is exist', () => {
        assert.isDefined(senseHighlight.isRegistered);
    });

    it('isRegistered is true, it is a temporary method while the field type is exist', () => {
        assert.isTrue(senseHighlight.isRegistered());
    });

    it('isRegistered is true, it is a temporary method while the field type is exist', () => {
        assert.isTrue(senseHighlight2.isRegistered());
    });

    it('destroyItself method is defined', () => {
        assert.isDefined(senseHighlight.destroyItself);
    });

    describe('Export/Import', () => {
        var exportTree = tree.map(obj => obj.export), newTree = [];

        it('Check export operation', () => {
            assert.equal(exportTree.length, 3);
        });

        it('Check the first exported url to having 2 nested objects', () => {
            assert.equal(exportTree[0]._export.nested.length, 2);
        });

        exportTree.forEach(data => {
            var newObject;
            if (SenseHighlight.isOwnType(data.type)) {
                newObject = new SenseHighlight();
            } else {
                newObject = new SenseURL();
            }
            newObject.export = data;
            newTree.push(newObject);
        });

        it('Check import operation', () => {
            assert.equal(newTree.length, 3);
        });

        SenseHighlight.fixImport(newTree);

        tree.forEach((url, idx) => {
            it('Check equivalence of the element number ' + idx, () => {
                assert.isTrue(url.isEqual(newTree[idx]));
            });
        });
    });

    it('Check destroying of the senseHighlight', () => {
        var senseHighlight3 = new SenseHighlight(sURL, {
            text: title, path: 'path', classId: 'A', type: 'highlight'
        }, nodeIterator);
        senseHighlight3.destroyItself();
        assert.isUndefined(senseHighlight3.keeper);
    });
});
