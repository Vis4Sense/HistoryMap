/**
 * Created by steve on 9/17/16.
 */
describe('SenseKnowledge', () => {
    const TITLE = 'Sense Knowledge Map',
        ID = d3.time.format('%Y%m%d%H%M%S')(new Date());
    var senseKnowledge, error;

    try {
        senseKnowledge = new SenseKnowledge({title: TITLE});
        senseKnowledge.id = ID;
    } catch (e) {
        error = e;
    }

    it('Lookup SenseKnowledge Class', () => {
        assert.isDefined(senseKnowledge);
    });
    // Do not continue the rest of the tests if there is any error
    if (error) {
        return false;
    }

    it('Check the title of the sensHistory object', () => {
        assert.equal(senseKnowledge.options.title, TITLE);
    });

    it('Check the file name of the sensHistory object', () => {
        assert.equal(senseKnowledge.id, ID);
    });

    it('Check the registered type "blur" of the SenseKnowledge', () => {
        assert.isTrue(SenseKnowledge.isRegisteredType('blur'));
    });

    it('Check the registered type "cur-focus" of the SenseKnowledge', () => {
        assert.isTrue(SenseKnowledge.isRegisteredType('cur-focus'));
    });

    it('Check the registered type "col-focus" of the SenseKnowledge', () => {
        assert.isFalse(SenseKnowledge.isRegisteredType('col-focus'));
    });

});
