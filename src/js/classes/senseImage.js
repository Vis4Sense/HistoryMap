/**
 * The class SenseImage is an abstraction of any small page shot of the web page
 *
 * Created by steve on 8/11/16.
 */
class SenseImage {
    /**
     * Create an instance of the SenseImage
     * was function(dataUrl, maxWidth, maxHeight, callback) {
     *
     * @param {String} url
     * @param {{maxWidth: Number, maxHeight: Number, ratio: Number}|{}} options
     * @param {Function} [callback]
     */
    constructor(url, options, callback) {
        var sImage = this,
            canvas  = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        options = options || {};
        sImage.image = new Image();
        sImage.image.setAttribute('crossOrigin', 'anonymous');
        sImage.image.onload = () => {
            if (!sImage.image) {
                return;
            }
            var ratio = options.ratio || 2;
            if (options.maxWidth && options.maxHeight) {
                ratio = Math.max(sImage.image.width / options.maxWidth, sImage.image.height / options.maxHeight);
            }
            canvas.width = sImage.image.width / ratio;
            canvas.height = sImage.image.height / ratio;
            ctx.drawImage(sImage.image, 0, 0, sImage.image.width, sImage.image.height, 0, 0, canvas.width, canvas.height);
            sImage.data = canvas.toDataURL('image/png', 1);
            if (typeof callback == 'function') {
                callback(sImage.data);
            }
        };
        sImage.image.src = url;
    }
    /**
     * Static function of SenseImage which returns base64 in callback
     *
     * @param {String} url
     * @param {Function} [callback]
     */
    static getDataURL(url, callback) {
        var me = {},
            canvas  = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        me.image = new Image();
        // for testing in browser
        me.image.setAttribute('crossOrigin', 'anonymous');
        me.image.src = url;
        me.image.onload = function() {
            // var ratio = Math.max(this.width / maxWidth, this.height / maxHeight);
            var ratio = 2;
            canvas.width = this.width / ratio;
            canvas.height = this.height / ratio;
            ctx.drawImage(me.image, 0, 0, this.width, this.height, 0, 0, canvas.width, canvas.height);
            if (typeof callback == 'function') {
                callback(canvas.toDataURL('image/png', 1));
            }
        };
    }
    /**
     * Check if given SenseImage is equal to this SenseImage
     *
     * @returns {boolean}
     */
    isEqual(senseImage) {
        return this.image && senseImage.image && this.image.src === senseImage.image.src;
    }
    /**
     * Clear image field
     *
     */
    destroyItself() {
        this.image = undefined;
    }
}
