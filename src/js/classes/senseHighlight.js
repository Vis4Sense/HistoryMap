// import { SenseURL }  from './senseUrl';
/**
 * The class SenseHighlight is an abstraction of any highlighted block on any web page
 */
class SenseHighlight extends SenseURL {
    /**
     * Create a new instance of highlight
     * options.path - where this highlight is placed on the page
     * options.type - temporary field to keep compatibility to old system
     *
     * @param {SenseURL} parent
     * @param {{url: String, text: String, path: String, classId: String, type: String}} [options]
     * @param {function} [generator]
     */
    constructor(parent, options, generator) {
        var isGenerator, id;
        isGenerator = generator && typeof generator === 'object' && generator instanceof senseNodeIterator;
        if (isGenerator) {
            id = generator.next().value;
        } else {
            id = Date.now();
        }
        options = options || {};
        if (parent) {
            options.url = options.url || parent.url;
        }
        super(options.url, options.text, id);
        this._text = options.text;
        this._type = options.type || 'highlight';
        this._path = options.path;
        this._classId = options.classId;
        if (parent) {
            this._from = parent.id;
            this.keeper = parent;
        }
    }
    /**
     * Get an export variant to save in a database or a zip file
     *
     * @returns {{id: Number, url: String, title: String, favIconUrl: String, isSearchEngine: Boolean,
     *  time: String, _export: {keeper: Number|Null, nested: Array, leader: Number|Null, slaves: Array},
     *  text: String, type: String, path: String, classId: String, from: Number}}
     */
    get export() {
        var data = super.export;
        Object.assign(data, {
            text: this.text,
            type: this.type,
            path: this.path,
            classId: this.classId,
            from: this.from
        });
        return data;
    }
    /**
     * Import from the saved variant in the database or from the zip file
     *
     * @param {{id: Number, url: String, title: String, favIconUrl: String, isSearchEngine: Boolean,
     *  time: String, _export: {keeper: Number|Null, nested: Array, leader: Number|Null, slaves: Array},
     *  text: String, type: String, path: String, classId: String, from: Number}} data
     */
    set export(data) {
        Object.assign(this, data);
        super.export = data;
    }
    /**
     * The getter 'leader' always returns NULL from an instance of the class SenseHighlight
     *
     * @returns {SenseURL}
     */
    get leader() {
        return null;
    }
    /**
     * Don't allow the setter 'leader' for the class SenseHighlight
     *
     * @param {SenseURL} parent
     */
    set leader(parent) {
        throw 'Don\'t allow to run the setter "leader" for the class SenseHighlight';
    }
    /**
     * Get a user's title of the SenseHighlight
     *
     * @return {String}
     */
    get text() {
        return this._text;
    }
    /**
     * Set a user's title of the SenseHighlight
     *
     * @param {String} newTitle
     */
    set text(newTitle) {
        this._text = newTitle;
        super.enlargeVersion();
    }
    /**
     * Get a type of the SenseHighlight
     *
     * @return {String}
     */
    get type() {
        return this._type;
    }
    /**
     * Set a type of the SenseHighlight
     *
     * @param {String} newType
     */
    set type(newType) {
        this._type = newType;
        super.enlargeVersion();
    }
    /**
     * Get a path from the page
     *
     * @return {String|Undefined}
     */
    get path() {
        return this._path;
    }
    /**
     * Set a path to the SenseHighlight from the page
     *
     * @param {String|Undefined} newValue
     */
    set path(newValue) {
        this._path = newValue;
        super.enlargeVersion();
    }
    /**
     * Get a class id for the SenseHighlight for the page
     *
     * @return {String|Undefined}
     */
    get classId() {
        return this._classId;
    }
    /**
     * Set a new class id for the SenseHighlight in the page
     *
     * @param {String|Undefined} newValue
     */
    set classId(newValue) {
        this._classId = newValue;
        super.enlargeVersion();
    }
    /**
     * Return the refer to the SenseNode
     *
     * @returns {Number}
     */
    get from() {
        return this._from;
    }
    /**
     * Set a refer to the node
     *
     * @param {Number} refer
     */
    set from(refer) {
        // this checking is for just in case because of possible resetting the same value in the old architecture
        if (this._from != refer) {
            this._from = refer;
            super.enlargeVersion();
        }
    }
    /**
     * Compare this instance with another instance and return true if they are identical
     *
     * @param {SenseURL} senseHighlight
     * @return {Boolean}
     */
    isEqual(senseHighlight) {
        var equal = super.isEqual(senseHighlight);
        if (equal) {
            equal = this.text == senseHighlight.text
                && this.type == senseHighlight.type
                && this.path == senseHighlight.path
                && this.classId == senseHighlight.classId
                && this.from == senseHighlight.from;
        }
        return equal;
    }
    /**
     * Check if highlight is a filter
     *
     * @returns {Boolean}
     */
    isSearch() {
        return this.type === 'filter';
    }
    /**
     * Check an embedded type of highlight
     *
     * @returns {Boolean}
     */
    isEmbedded() {
        return this.type && SenseHighlight.isOwnType(this.type);
    }
    /**
     * Return true because it is a registered type
     *
     * @returns {Boolean}
     */
    isRegistered() {
        return true;
    }
    /**
     * It's dumb to compatibility with the old system
     *
     * @param {String} url
     */
    hasSearchFilter(url) {
        throw 'This object can not have any additional filters. Url is ' + url;
    }
    /**
     * Destroy this object by deleting a link to the parent
     */
    destroyItself() {
        this.time = undefined;
        this.keeper = undefined;
    }
    /**
     * Check if a type is belong to the class SenseHighlight
     *
     * @param {String} type
     * @return {Boolean}
     */
    static isOwnType(type) {
        return ['highlight', 'note', 'filter'].includes(type);
    }
}
