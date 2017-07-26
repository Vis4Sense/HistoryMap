/**
 * Created by steve on 9/17/16.
 */
describe('SenseHistory', () => {
    const TITLE = 'Sense History Map',
        ID = d3.time.format('%Y%m%d%H%M%S')(new Date());
    var senseHistory, error;

    try {
        senseHistory = new SenseHistory({
            noMediator: true,
            title: TITLE,
            inventory: true
        });
        senseHistory.id = ID;
    } catch (e) {
        error = e;
    }

    it('Lookup SenseHistory Class', () => {
        assert.isDefined(senseHistory, error);
    });
    // Do not continue the rest of the tests if there is any error
    if (error) {
        return false;
    }

    it('Check the title of the sensHistory object', () => {
        assert.equal(senseHistory.options.title, TITLE);
    });

    it('Check the file name of the sensHistory object', () => {
        assert.equal(senseHistory.id, ID);
    });

    it('Check if senseHistory.listening is false', () => {
        assert.isFalse(senseHistory.listening);
    });

    it('Check the registered type "blur" of the SenseHistory', () => {
        assert.isTrue(SenseHistory.isRegisteredType('blur'));
    });

    it('Check the registered type "col-focus" of the SenseHistory', () => {
        assert.isTrue(SenseHistory.isRegisteredType('col-focus'));
    });

    it('Check the registered type "cur-focus" of the SenseHistory', () => {
        assert.isFalse(SenseHistory.isRegisteredType('cur-focus'));
    });

    it('Check if senseHistory.actions is array', () => {
        assert.isArray(senseHistory.actions);
    });

    it('Check if senseHistory.senseNodes is array', () => {
        assert.isArray(senseHistory.senseNodes);
    });
});
