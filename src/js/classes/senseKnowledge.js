/**
 * Created by steve on 9/17/16.
 */
class SenseKnowledge extends SenseGrid {
    /**
     * Create the Knowledge Map
     *
     * @param {{title: String, debugKnowledge: Boolean}} options
     */
    constructor(options) {
        const title = 'Knowledge Map';
        super();
        if (options && Object.keys(options).length) {
            if (!options.title) {
                options.title = title;
            }
            if (options.labelGenerator == undefined) {
                options.labelGenerator = false;
            }
            options.debug = !!options.debugKnowledge;
        } else {
            options = {
                labelGenerator: false,
                debug: false,
                title: title
            };
        }
        this.id = d3.time.format('%Y%m%d%H%M%S')(new Date());
        this.options = options;
    }
    /**
     * Check if the var type is registered in the Knowledge Map
     *
     * @param {String} type
     * @returns {Boolean}
     */
    static isRegisteredType(type) {
        return [
            'focus', 'blur', 'keydown', 'mousewheel', 'mousemove', 'mousedown',
            'cur-focus', 'cur-blur', 'cur-keydown', 'cur-mousewheel', 'cur-mousemove', 'cur-mousedown'
        ].includes(type);
    }
}
