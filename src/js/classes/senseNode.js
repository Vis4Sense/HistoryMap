// import { SenseNode } from './senseNode';
/**
 * The class SenseNode is a visual abstraction of any SenseURL object
 *
 * Created by steve on 8/9/16.
 */
class SenseNode extends SenseURL {
    /**
     * Create a node
     *
     * @param {String} url
     * @param {String} newTitle
     * @param {String} type
     * @param {String|Undefined} favIconUrl
     * @param {Function} [generator]
     */
    constructor(url, newTitle, type, favIconUrl, generator) {
        var isGeneratorPresented = generator && typeof generator === 'object' && generator instanceof senseNodeIterator,
            id = isGeneratorPresented ? generator.next().value : Date.now();
        super(url, newTitle, id);
        // check if a generator is presented then we use it
        this._favIconUrl = favIconUrl;
        this._type = type;
        this._favorite = false;
        this._text = newTitle;
        this._image = undefined;
        this._userImage = undefined;
        this._minimized = false;
        this._curated = false;
        this._highlighted = false;
        // _seen and isVisited are the same fields
        this._seen = false;
        this.endTime = this.isEmbedded() ? undefined : this.id + 1;
        // State fields
        this.tabId = undefined;
        this.windowId = undefined;
        // End time
        return this;
    }
    /**
     * Get an export variant to save in a database or a zip file
     *
     * @returns {{id: Number, url: String, title: String, favIconUrl: String, isSearchEngine: Boolean,
     *  time: String, _export: {keeper: Number|Null, nested: Array, leader: Number|Null, slaves: Array},
     *  text: String, type: String, favorite: Boolean, image: String, minimized: Boolean,
     *  _seen: Boolean, _from: Number, curated: Boolean, endTime: Number}}
     */
    get export() {
        var data = super.export;
        Object.assign(data, {
            type: this.type,
            favorite: this.favorite,
            text: this.text,
            image: this.image,
            userImage: this.userImage,
            minimized: this.minimized,
            favIconUrl: this._favIconUrl,
            _seen: this._seen,
            _from: this._from,
            _curated: this._curated ? {x: this._curated.x, y: this._curated.y} : false,
            collectionRemoved: this.collectionRemoved,
            endTime: this.endTime
        });
        return data;
    }
    /**
     * Import from the saved variant in the database or the zip file.
     * Note: Don't forget to launch SenseURL.fixImport() after the import
     *
     * @param {{id: Number, url: String, title: String, favIconUrl: String, isSearchEngine: Boolean,
     *  time: String, _export: {keeper: Number|Null, nested: Array, leader: Number|Null, slaves: Array},
     *  text: String, type: String, favorite: Boolean, image: String, minimized: Boolean,
     *  _seen: Boolean, _from: Number, curated: Boolean, endTime: Number}} data
     */
    set export(data) {
        Object.assign(this, data);
        this._favIconUrl = data.favIconUrl || this._favIconUrl;
        super.export = data;
    }
    /**
     * Get favIconUrl of the SenseNode
     *
     * @returns {String}
     */
    get favIconUrl() {
        return this._favIconUrl;
    }
    /**
     * Set favIconUrl of the SenseNode
     *
     * @param {String} newFaviconUrl
     */
    set favIconUrl(newFaviconUrl) {
        this._favIconUrl = newFaviconUrl;
        super.enlargeVersion();
    }
    /**
     * Get a type of the SenseNode
     *
     * @return {String}
     */
    get type() {
        return this._type;
    }
    /**
     * Set a type of the SenseNode
     *
     * @param {String} newType
     */
    set type(newType) {
        this._type = newType;
        super.enlargeVersion();
    }
    /**
     * Get a favorite status of the SenseNode
     *
     * @return {Boolean}
     */
    get favorite() {
        return this._favorite;
    }
    /**
     * Set a favorite status of the SenseNode
     *
     * @param {Boolean} newValue
     */
    set favorite(newValue) {
        this._favorite = newValue;
        super.enlargeVersion();
    }
    /**
     * Get a user's title of the SenseNode
     *
     * @return {String}
     */
    get text() {
        return this._text;
    }
    /**
     * Set a user's title of the SenseNode
     *
     * @param {String} newTitle
     */
    set text(newTitle) {
        this._text = newTitle;
        super.enlargeVersion();
    }
    /**
     * Get a snapshot of the SenseNode
     *
     * @return {String|Undefined}
     */
    get image() {
        return this._image;
    }
    /**
     * Get a snapshot of the SenseNode
     *
     * @param {String|Undefined} newImage
     */
    set image(newImage) {
        this._image = newImage;
        super.enlargeVersion();
    }
    /**
     * Get a custom snapshot which is made from another image on the page
     *
     * @return {String|Undefined}
     */
    get userImage() {
        return this._userImage;
    }
    /**
     * Set a custom snapshot which is made from another image on the page
     *
     * @param {String|Undefined} newUserImage
     */
    set userImage(newUserImage) {
        this._userImage = newUserImage;
        super.enlargeVersion();
    }
    /**
     * Get a minimized status of the SenseNode
     *
     * @return {Boolean}
     */
    get minimized() {
        return this._minimized;
    }
    /**
     * Set a minimized status of the SenseNode
     *
     * @param {Boolean} newValue
     */
    set minimized(newValue) {
        this._minimized = newValue;
        super.enlargeVersion();
    }
    /**
     * Get a curated status of the SenseNode
     *
     * @return {Boolean}
     */
    get curated() {
        return this._curated;
    }
    /**
     * Set a curated status of the SenseNode
     *
     * @param {Boolean} newValue
     */
    set curated(newValue) {
        this._curated = newValue;
        super.enlargeVersion();
    }
    /**
     * Get a highlighted status of the SenseNode
     *
     * @return {Boolean}
     */
    get highlighted() {
        return this._highlighted;
    }
    /**
     * Set a highlighted status of the SenseNode
     *
     * @param {Boolean} newValue
     */
    set highlighted(newValue) {
        this._highlighted = newValue;
        super.enlargeVersion();
    }
    /**
     * Get a seen flag
     *
     * @return {Boolean}
     */
    get seen() {
        return this._seen;
    }
    /**
     * Set a seen flag. If it happens at the first time then remove the field this.neverSeen
     *
     * @param {Boolean} newSeen
     */
    set seen(newSeen) {
        // Do not allow to set false to the variable this._seen
        if (!this._seen) {
            this._seen = newSeen;
            super.enlargeVersion();
        }
    }
    /**
     * Return the refer to the node
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
     * @param {SenseNode} senseNode
     * @return {Boolean}
     */
    isEqual(senseNode) {
        var equal = super.isEqual(senseNode);
        if (equal) {
            equal = this.type == senseNode.type
                && this.text == senseNode.text
                && this.image == senseNode.image
                && this.endTime == senseNode.endTime;
        }
        return equal;
    }
    /**
     * Check search type of any action in the browser for the type
     *
     * @returns {Boolean}
     */
    isSearch() {
        return this.type && SenseNode.isSearchType(this.type);
    }
    /**
     * Return false because it is not an embedded type
     *
     * @returns {Boolean}
     */
    isEmbedded() {
        return false;
    }
    /**
     * Check if a type of SenseNode is registered
     *
     * @returns {Boolean}
     */
    isRegistered() {
        return this.type && SenseNode.isRegisteredType(this.type);
    }
    /**
     * Check if this node has the filter highlights
     *
     * @param {String} url
     * @returns {Boolean}
     */
    hasSearchFilter(url) {
        var idx = -1;
        if (this.isSearchEngine) {
            idx = this.nested.findIndex(nested => nested.url == url);
        }
        return this.isSearchEngine && idx >= 0;
    }
    /**
     * Check search type of any action in the browser
     *
     * @param {String} type
     * @returns {Boolean}
     */
    static isSearchType(type) {
        return ['search', 'location', 'dir'].includes(type);
    }
    /**
     * Check an embedded type of any action in the browser
     *
     * @param {String} type
     * @returns {Boolean}
     */
    static isEmbeddedType(type) {
        return ['highlight', 'note', 'filter'].includes(type);
    }
    /**
     * Check if a type of an action is registered
     *
     * @param {String} type
     * @returns {Boolean}
     */
    static isRegisteredType(type) {
        return [
            'search', 'location', 'dir', 'highlight', 'note', 'filter', 'link', 'type', 'bookmark'
        ].includes(type);
    }
    /**
     * Take a snapshot using feedly/pocket/firefox reading mode if nonStandardCapture is true
     *
     * @param {{url: String, width: Number, height: Number, windowId: Number,
     *  noSnapshots: Boolean, nonStandardCapture: Boolean}} options
     * @param {Function} [callback]
     */
    takeFirefoxSnapshot(options, callback) {
        var node = this, isCallback = typeof callback == 'function';
        if (options.nonStandardCapture) {
            let uri, xhr, snapshot,
                snapshots = document.getElementsByClassName('firefox-snapshots'),
                prePath = node.URL.protocol + '//' + node.URL.host,
                path = node.URL.pathname.substr(0, node.URL.pathname.lastIndexOf('/') + 1);
            uri = {
                spec: node.URL.href,
                host: node.URL.host,
                prePath: prePath,
                scheme: node.URL.protocol.substr(0, node.URL.protocol.indexOf(':')),
                pathBase: prePath + path
            };
            if (snapshots.length) {
                snapshot = snapshots[0];
                snapshot.style.width = options.width + 'px';
                snapshot.style.height = options.height + 'px';
                // snapshot.style.bottom = 0;
                snapshot.style.bottom = '-' + snapshot.style.height;
            }
            xhr = new XMLHttpRequest();
            xhr.onload = () => {
                var article, error;
                // Todo going to add here the Readability feature
                try {
                    article = new Readability(uri, xhr.responseXML).parse();
                } catch (e) {
                    error = e;
                }
                if (!error && xhr.responseXML && snapshot && article) {
                    snapshot.innerHTML = article.content;
                    html2canvas(snapshot, {
                        allowTaint: true,
                        height: options.height,
                        width: options.width,
                    }).then(canvas => {
                        node.image = canvas.toDataURL('image/png', 1);
                        if (isCallback) {
                            callback(true);
                        }
                        snapshot.innerHTML = '';
                    });
                } else {
                    standardCapture();
                }
            };
            xhr.onerror = () => {
                standardCapture();
            };
            xhr.open('GET', node.url);
            xhr.responseType = 'document';
            xhr.send();
        } else {
            standardCapture();
        }
        /**
         * Standard way to capture a node thumbnail
         */
        function standardCapture() {
            chrome.windows.get(options.windowId, tab => {
                if (!tab.focused || options.noSnapshots) {
                    node.image = undefined;
                    if (isCallback) {
                        callback(true);
                    }
                } else if (options.forceUpdateSnapshot || !node.image) {
                    chrome.tabs.captureVisibleTab(options.windowId, {format: 'png'}, dataUrl => {
                        // Reduce size of the snapshot at least 2 time
                        new SenseImage(dataUrl, {}, imageData => {
                            node.image = imageData;
                            if (isCallback) {
                                callback(true);
                            }
                        });
                    });
                }
            });
        }
    }
    /**
     * Get a snap shot from the browser for windowId
     *
     * @param {Number} windowId
     * @param {{debug: Boolean, nonStandardCapture: Boolean,
     *  noSnapshots: Boolean, forceUpdateSnapshot: Boolean}} options
     * @param {Function} [callback]
     */
    takeSnapShot(windowId, options, callback) {
        var node = this;
        if (!(node.seen || options.forceUpdateSnapshot)) {
            if (typeof callback == 'function') {
                callback(false);
            }
            return;
        }
        // Check again if the tab is going to be captured is the same as the tab needs to capture.
        // Otherwise, if the user stays in a tab less than the waiting amount, wrong tab could be captured.
        chrome.tabs.query({windowId: windowId, active: true}, tabs => {
            if (tabs.length) {
                let params = {
                    url: node.url,
                    width: tabs[0].width, height: tabs[0].height,
                    windowId: windowId
                };
                Object.assign(params, options);
                node.takeFirefoxSnapshot(params, callback);
            }
        });
    }
    /**
     * Force update favIconURL by looking for all the tabs where the url is opened
     */
    updateFavIconUrl() {
        var context = this;
        chrome.tabs.query({url: this.url}, tabs => {
            if (tabs.length && tabs[0].favIconUrl) {
                context.favIconUrl = tabs[0].favIconUrl;
            }
        });
    }
    /**
     * Lookup all the tabs with this.url and close them
     */
    closeAllTabs() {
        var context = this;
        chrome.tabs.query({url: context.url}, tabs => {
            chrome.tabs.remove(tabs.map(tab => tab.id));
        });
    }
    /**
     * The static method creates a new object like a node.
     * Just get real fields, not the generated one to prevent circular json.
     * Don't need to save 'state' properties because they have their corresponding actions,
     * which generate those properties such as favorite, minimized 'value' is to store the state property in the action.
     * 'trp': we don't want to save 'rp', which is a state property
     *
     * @param {Object} node
     * @return {Object}
     */
    static getCoreData(node) {
        var filteredNode = {};
        [
            'id', 'text', 'url', 'type', 'time', 'endTime', 'favIconUrl', 'classId', 'path',
            'from', 'seen', 'value', 'sourceId', 'targetId', 'trp'
        ].forEach(field => {
            if (node[field] !== undefined) {
                filteredNode[field] = node[field];
            }
        });
        return filteredNode;
    }
}
/**
 * A generator function to the SenseNode class to make id as unique field
 */
function* senseNodeIterator() {
    var lastId, newId = Date.now();

    lastId = newId;
    while (true) {
        yield newId;
        newId = Date.now();
        if (newId <= lastId) {
            newId = lastId + 1;
        }
        lastId = newId;
    }
}
