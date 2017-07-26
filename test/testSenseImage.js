describe('SenseImage', () => {
    const wikipediaUrl = 'https://en.wikipedia.org/wiki/Structured_systems_analysis_and_design_method',
        senseImageUrl = 'http://image.flaticon.com/icons/svg/149/149061.svg';
    var sURL,
        GlobalSenseImageObj = new SenseImage(senseImageUrl, {}, () => {}),
        SenseImageObj;

    it('initialisation class SenseURL', () => {
        sURL = new SenseURL(wikipediaUrl, 'Wikipedia');
        assert.isObject(sURL);
    });

    it('initialization (constructor) of SenseImage', () => {
        var senseImageCallback = (dataURL) => {
            SenseImage.getDataURL(senseImageUrl, (base64) => {
                assert.equal(dataURL, base64);
            });
        };
        SenseImageObj = new SenseImage(senseImageUrl, {}, senseImageCallback);
    });

    it('image.src is defined', () => {
        assert.isDefined(GlobalSenseImageObj.image.src);
    });

    it('image.src is String', () => {
        assert.isString(GlobalSenseImageObj.image.src);
    });

    it('image.title is defined', () => {
        assert.isDefined(GlobalSenseImageObj.image.title);
    });

    it('image.title is String', () => {
        assert.isString(GlobalSenseImageObj.image.title);
    });

    it('image.data is defined', () => {
        new SenseImage(senseImageUrl, {}, imageData => {
            assert.isDefined(imageData);
        });
    });

    it('A link of SenseImageObj is defined', () => {
        assert.isDefined(GlobalSenseImageObj.image.src);
    });

    it('The link of SenseImageObj is equal to ' + senseImageUrl, () => {
        assert.equal(GlobalSenseImageObj.image.src, senseImageUrl);
    });

    it('SenseImage.isSameURL(anotherSenseImage) should be boolean', () => {
        var SenseImageObj1 = new SenseImage(senseImageUrl, {}, () => {
            var SenseImageObj2 = new SenseImage(senseImageUrl, {}, () => {
                assert.isBoolean(SenseImageObj1.isEqual(SenseImageObj2));
            });
        });
    });

    it('SenseImage.isSameURL(anotherSenseImage) should be true', () => {
        var SenseImageObj = new SenseImage(senseImageUrl, {}, () => {});
        assert.isTrue(GlobalSenseImageObj.isEqual(SenseImageObj));
    });

    it('SenseImage.destroyItself() is defined', () => {
        var SenseImageObj = new SenseImage(senseImageUrl, {}, () => {});
        assert.isFunction(SenseImageObj.destroyItself);
    });

    it('SenseImage.destroyItself() has empty Image', () => {
        var SenseImageObj = new SenseImage(senseImageUrl, {}, () => {});

        SenseImageObj.destroyItself();
        assert.isUndefined(SenseImageObj.image);
    });
});
