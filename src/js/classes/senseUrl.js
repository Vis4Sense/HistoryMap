// import { SenseURL } from './senseUrl';
/**
 * Set of classes to implement the pattern Mediator
 * (https://addyosmani.com/resources/essentialjsdesignpatterns/book/#mediatorpatternjavascript)
 * The class SenseURL is a primary class. Also it's a base gist for the whole system.
 *
 * Created by Steve Bidenko 8/4/16 on request Seven Iac, Lviv, Ukraine.
 */
class SenseURL {
    /**
     * Create a new instance of url
     *
     * @param {String} url
     * @param {String} [newTitle]
     * @param {Number} [id]
     */
    constructor(url, newTitle, id) {
        if (url) {
            this.URL = new URL(url);
        }
        this._url = url;
        this._keeper = this._leader = null;
        this._nested = [];
        this._slaves = [];
        this._title = newTitle;
        this._version = 1;
        this.isSearchEngine = false;
        this.id = id;
        this.time = Date.now();
    }
    /**
     * Get a version of this instance
     *
     * @return {Number}
     */
    get version() {
        return this._version;
    }
    /**
     * Set a new version of this instance
     *
     * @param {Number} newVersion
     */
    set version(newVersion) {
        throw 'It doesn\'t allow to change the version by the value: ' + newVersion;
    }
    /**
     * Enlarge the version of this instance and return this one
     *
     * @return {number}
     */
    enlargeVersion() {
        return ++this._version;
    }
    /**
     * Get the url of the object
     *
     * @returns {String}
     */
    get url() {
        return this._url;
    }
    /**
     * Set a new url
     *
     * @param {String} newUrl
     */
    set url(newUrl) {
        this.URL = new URL(newUrl);
        this._url = newUrl;
        this.enlargeVersion();
    }
    /**
     * Get the title of the url
     *
     * @returns {String} newTitle
     */
    get title() {
        return this._title;
    }
    /**
     * Set a new title of the url
     *
     * @param {String} newTitle
     */
    set title(newTitle) {
        this._title = newTitle;
        // To compatibility with the old architecture
        this.text = newTitle;
        this.enlargeVersion();
    }
    /**
     * Get the parent of the current SenseURL
     *
     * @returns {SenseURL}
     */
    get keeper() {
        return this._keeper;
    }
    /**
     * Remove this object from the child of the current parent and set a new parent
     *
     * @param {SenseURL} newParent
     */
    set keeper(newParent) {
        var child = this,
            equal = c => c.time == child.time,
            children = this._keeper ? this._keeper._nested : [],
            childNumber = children.findIndex(equal);
        // Need to check and remove from _nested of the current parent
        if (childNumber > -1) {
            children.splice(childNumber, 1);
        }
        this._keeper = newParent;
        // need to add this object to the children of the new parent
        if (newParent) {
            children = newParent._nested;
            childNumber = children.findIndex(equal);
            // if it has been already finding in the new parent
            if (childNumber < 0) {
                children.push(child);
            }

        }
        this.enlargeVersion();
    }
    /**
     * Get all the children
     *
     * @returns {Array}
     */
    get nested() {
        return this._nested;
    }
    //noinspection JSAnnotator
    /**
     * Adding a new child will call an exception
     *
     * @param {SenseURL} childSenseURL
     */
    set nested(childSenseURL) {
        throw 'Use only the property "keeper" of the keeper object to set new nested ' + JSON.stringify(childSenseURL);
    }
    /**
     * Get a leader of this object
     *
     * @returns {SenseURL}
     */
    get leader() {
        return this._leader;
    }
    /**
     * Remove this object from the slaves of the current leader and set a new leader for this one
     *
     * @param {SenseURL} newLeader
     */
    set leader(newLeader) {
        var link = this,
            equal = link.id ? s => s.id == link.id : s => s.time == link.time,
            slaves = this._leader ? this._leader._slaves : [],
            slaveNumber = slaves.findIndex(equal);
        // Need to check and remove from _nested of the current parent
        if (slaveNumber >= 0) {
            slaves.splice(slaveNumber, 1);
        }
        this._leader = newLeader;
        // need to add this object to the children of the new parent
        if (newLeader) {
            slaves = newLeader._slaves;
            slaveNumber = slaves.findIndex(equal);
            // add a new link if it is not exist in the new leader
            if (slaveNumber < 0) {
                slaves.push(link);
            }
        }
        this.enlargeVersion();
    }
    /**
     * Get all the slaves of this object
     *
     * @returns {Array}
     */
    get slaves() {
        return this._slaves;
    }
    //noinspection JSAnnotator
    /**
     * Adding a new link will call an exception
     *
     * @param {SenseURL} newLink
     */
    set slaves(newLink) {
        throw 'Use only the property "leader" of the slave object to add a new link ' + JSON.stringify(newLink);
    }
    /**
     * Compare two urls to figure their equivalence out
     *
     * @param {String} url
     * @returns {boolean}
     */
    isSameURL(url) {
        var selfURL = this.URL,
            compareURL = new URL(url);
        // console.log('Comparing ' + this.url + ' with a new url ' + compareURL + '. The result is ', result);
        return selfURL.url == compareURL.url && selfURL.pathname == compareURL.pathname;
    }
    /**
     * Compare this instance with another instance and return true if they are identical
     *
     * @param {SenseURL} senseUrl
     * @return {Boolean}
     */
    isEqual(senseUrl) {
        return this.toString() == senseUrl.toString();
    }
    /**
     * To use in debug purposes
     *
     * @returns {String}
     */
    toString() {
        return JSON.stringify({
            url: this.url,
            title: this._title,
            isSearchEngine: this.isSearchEngine,
            time: new Date(this.time).toISOString(),
            keeper: this._keeper ? 'has the keeper ' + this._keeper.url : null,
            nested: this._nested.length
                ? 'has the nested ' + JSON.stringify(this._nested.map(child => child.url))
                : null,
            leader: this._leader ? 'has the leader ' + this._leader.url : null,
            slaves: this._slaves.length
                ? 'has the slaves ' + JSON.stringify(this._slaves.map(slave => slave.url))
                : null
        });
    }
    /**
     * Get an export variant to save in a database or a zip file
     *
     * @returns {{id: Number, url: String, title: String, favIconUrl: String, isSearchEngine: Boolean,
     *  time: String, _export: {keeper: Number|Null, nested: Array, leader: Number|Null, slaves: Array},
     *  _version: Number|Undefined}}
     */
    get export() {
        return {
            id: this.id,
            url: this._url,
            title: this._title,
            _version: this._version,
            isSearchEngine: this.isSearchEngine,
            time: new Date(this.time).toISOString(),
            _export: {
                keeper: this._keeper ? this._keeper.id : null,
                nested: this._nested.map(child => child.id),
                leader: this._leader ? this._leader.id : null,
                slaves: this._slaves.map(slave => slave.id)
            }
        };
    }
    /**
     * Set fields from the export variant.
     * Note: we need to restore the fields this._keeper, this._nested, this._leader, this._slaves
     * later after initialising of the objects
     *
     * @param {{id: Number, url: String, title: String, favIconUrl: String, isSearchEngine: Boolean,
     *  time: String, _export: {keeper: Number|Null, nested: Array, leader: Number|Null, slaves: Array},
     *  _version: Number|Undefined}} data
     */
    set export(data) {
        this.id = data.id || this.id;
        if (data.url) {
            this.URL = new URL(data.url);
            this._url = data.url;
        }
        this._title = data.title || this._title;
        this.isSearchEngine = typeof data.isSearchEngine == 'boolean' && data.isSearchEngine;
        this.time = new Date(data.time).getMilliseconds();
        this._export = JSON.parse(JSON.stringify(data._export));
        // Broke the links anyway
        this._keeper = null; this._nested = [];
        this._leader = null; this._slaves = [];
        this._version = data._version || 1;
    }
    /**
     * This static method calls after using the setter export to restore links (relations) between any 2 objects
     * The method accepts an array of all the objects which are maybe linked
     *
     * @param {Array} urls
     */
    static fixImport(urls) {
        urls.forEach((url, idx) => {
            var needClean = false;
            // Set the field keeper
            if (url._export && url._export.keeper) {
                urls[idx].keeper = urls.find(u => u.id == url._export.keeper);
                needClean = true;
            }
            // Set the field leader
            if (url._export && url._export.leader) {
                urls[idx].leader = urls.find(u => u.id == url._export.leader);
                needClean = true;
            }
            if (needClean || url._export) {
                delete urls[idx]._export;
            }
        });
    }
    /**
     * Get Google location
     *
     * @param {Object} url
     * @param {String} pathname
     * @returns {string}
     */
    static getGoogleLocation(url, pathname) {
        var trimUrl = url.pathname.substr(pathname.length + 1);
        return decodeURIComponent(trimUrl.substr(0, trimUrl.indexOf('/'))).replace(/\+/g, ' ');
    }
    /**
     * Get Google Map location
     *
     * @param {Object} url
     * @param {String} pathname
     * @returns {String} label from the pathname
     */
    static getGoogleMapLocation(url, pathname) {
        return url.pathname.substr(pathname.length + 1);
    }
    /**
     * Get Google Direction from the url, for example
     * https://www.google.co.uk/maps/dir/The+World+Bank,+1818+H+Street+Northwest,+Washington,+DC+20433,
     *  +United+States/1914+Connecticut+Ave+NW,+Washington,+DC+20009,+USA/@38.9078884,-77.052622,
     *  15z/data=!4m14!4m13!1m5!1m1!1s0x89b7b7b0d7ea2d85
     *  :0x7c0ffdf15a217ec5!2m2!1d-77.042488!2d38.898932!1m5!1m1!1s0x89b7b7cfbe539997
     *  :0xf50e91ad60a7f906!2m2!1d-77.0464992!2d38.9162252!3e0
     *
     * @param {Object} url
     * @param {String} pathname
     * @returns {Null|String}
     */
    static getGoogleDirection(url, pathname) {
        var trimUrl = url.pathname.substr(pathname.length + 1),
            parts = trimUrl.split('/'),
            from = decodeURIComponent(parts[0]).replace(/\+/g, ' '),
            to = decodeURIComponent(parts[1]).replace(/\+/g, ' ');
        return from && to ? (from + ' to ' + to) : null;
    }
    /**
     * Returns an object wrapping the query string from the search part of a url.
     *
     * @param {String} searchString
     * @returns {Null|Object}
     */
    static getQueryStringFromSearch(searchString) {
        var delimiter, params = searchString.substr(1), result = {};

        if (params === '') {
            return null;
        }

        delimiter = params.indexOf(';') === -1 ? '&' : ';'; // To support both & and ; but prioritize ;
        params = params.split(delimiter);
        params.forEach(d => {
            var part = d.split('=');
            if (part.length === 2) {
                result[part[0]] = decodeURIComponent(part[1].replace(/\+/g, ' '));
            }
        });

        return result;
    }
    /**
     * If a search doesn't have a keyword, don't capture it.
     * Return true if it's a search (hostname and pathname) but the query is empty.
     * If it's not a search, or a search with non-empty query, return false.
     *
     * @param {Object} url
     * @returns {boolean}
     */
    static isEmptySearch(url) {
        const hostname = 'www.google.',
            pathname = '/webhp',
            reg = /\Wq=([\w%+-]*)/ig;

        if (url.hostname.startsWith(hostname) && url.pathname.includes(pathname)) {
            var result = url.toString().match(reg);
            return !result || !result.length;
        }

        return false;
    }
    /**
     * Checks and returns the searching route if applicable.
     *
     * @param {Object} url
     * @returns {{type: String, label: String}|Null}
     */
    static getSearchRoute(url) {
        var dirSearchTemplates = [{
            hostname: 'www.google.',
            pathname: '/maps/dir',
            labelFunc: this.getGoogleDirection
        }];

        for (var i = 0; i < dirSearchTemplates.length; i++) {
            var t = dirSearchTemplates[i];
            if (url.hostname.startsWith(t.hostname) && url.pathname.includes(t.pathname)) {
                var label = t.labelFunc(url, t.pathname);
                return label ? {type: 'dir', label: label} : null;
            }
        }

        return null;
    }
    /**
     * Checks and returns the searching location if applicable.
     *
     * @param {Object} url
     * @returns {{type: String, label: String}|Null}
     */
    static getLocation(url) {
        const locationSearchTemplates = [
            {
                hostname: 'www.google.',
                pathname: '/maps/search',
                labelFunc: this.getGoogleLocation
            }, {
                hostname: 'www.google.',
                pathname: '/maps/place',
                labelFunc: this.getGoogleLocation
            }, {
                hostname: 'www.google.',
                pathname: '/maps/@',
                labelFunc: this.getGoogleMapLocation
            }, {
                hostname: 'www.openstreetmap.',
                pathname: '/search',
                labelFunc: function(url) {
                    // https://www.openstreetmap.org/search?query=london#map=12/51.5485/-0.2123
                    var q = this.getQueryStringFromSearch(url.search);
                    return q ? q.query : q;
                }
            }
        ];
        for (var i = 0; i < locationSearchTemplates.length; i++) {
            var t = locationSearchTemplates[i];
            if (url.hostname.startsWith(t.hostname) && url.pathname.includes(t.pathname)) {
                var label = t.labelFunc(url, t.pathname);
                return label ? {type: 'location', label: label} : null;
            }
        }

        return null;
    }
    /**
     * Checks and returns the searching keyword if applicable.
     *
     * @param {Object} url
     * @returns {{type: String, label: String, name: String|Undefined}|Null}
     */
    static getKeyword(url) {
        const keywordSearchTemplates = [
            {
                hostname: 'www.google.',
                pathnames: ['/', '/webhp', '/search', '/url'],
                name: 'Google',
                reg: /\Wq=([\w%+-]*)/ig
            }, {
                hostname: 'www.bing.',
                pathnames: ['/search'],
                name: 'Bing',
                reg: /\Wq=([\w%+-]*)/i
            }, {
                hostname: 'search.yahoo.',
                pathnames: ['/search'],
                name: 'Yahoo',
                reg: /\Wp=([\w%+-]*)/i
            }, {
                hostname: 'ask.',
                pathnames: ['/web'],
                name: 'Ask',
                reg: /\Wq=([\w%+-]*)/i
            }, {
                hostname: 'duckduckgo.',
                pathnames: ['/'],
                name: 'DuckDuckGo',
                reg: /\Wq=([\w%+-]*)/i
            }, { // https://www.facebook.com/search/str/visualization/keywords_top
                hostname: 'www.facebook.',
                pathnames: ['/search/str'],
                name: 'Facebook',
                labelFunc: this.getGoogleLocation
            }, { // https://twitter.com/search?q=visualization&src=typd
                hostname: 'twitter.',
                pathnames: ['/search'],
                name: 'Twitter',
                reg: /\Wq=([\w%+-]*)/i
            }
        ];
        if (this.isEmptySearch(url)) {
            return 'skip';
        }
        var keyword = {type: 'search', label: ''};

        for (var i = 0; i < keywordSearchTemplates.length; i++) {
            var t = keywordSearchTemplates[i];
            if (url.hostname.startsWith(t.hostname) && t.pathnames.some(d => url.pathname.includes(d))) {
                keyword.name = t.name;
                if (t.reg) {
                    var result = url.toString().match(t.reg);

                    if (!result || !result.length) {
                        return null;
                    }

                    keyword.label = decodeURIComponent(result[result.length - 1]).replace(/\+/g, ' ');

                    // A quick fix for google search when it has both #q and q. Use 'g' to get all occurences, however they include #.
                    if (t.hostname === 'www.google.') {
                        keyword.label = keyword.label.substr(keyword.label.indexOf('=') + 1);
                    }

                    return keyword;
                } else {
                    keyword.label = t.labelFunc(url, t.pathnames[0]);
                    return keyword.label ? keyword : null;
                }
            }
        }

        return null;
    }
    /**
     * Detect search engine and return an object if applicable or NULL
     *
     * @param {Object|String} url
     * @returns {{type: String, label: String, name: String|Undefined}|Null}
     */
    static detectSearchEngine(url) {
        // check if url has the type string
        if (typeof url == 'string') {
            url = new URL(url);
        }
        // Checks in order and return the first one match: keyword - location - route
        return this.getKeyword(url) || this.getLocation(url) || this.getSearchRoute(url);
    }
    /**
     * Remove hash as it's an anchor. A page can have many anchors, thus different url, but still one page.
     * However, removing is not correct in this case:
     * https://www.google.co.uk/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=other%20search%20engines
     * Solution: store all full urls and compare each of them with the address. Not have time to do it now.
     *
     * @param {URL|String} url
     * @returns {String}
     */
    static removeHash(url) {
        if (typeof url == 'string') {
            url = new URL(url);
        }
        return url.origin + url.pathname + url.search;
    }
    /**
     * Remove a query string from the url and leave a part of url without search and hash
     * https://en.wikipedia.org/wiki/Uniform_Resource_Identifier
     *
     * @param {URL|String} url
     * @returns {String}
     */
    static removeQuery(url) {
        if (typeof url == 'string') {
            url = new URL(url);
        }
        return url.origin + url.pathname;
    }
    /**
     * Get uniqueId if this URL is search engine
     *
     * @param {String} url
     * @param {String} uniqueId
     * @returns {String}
     */
    static uniURL(url, uniqueId) {
        return SenseURL.removeHash(url) + '#' + uniqueId;
    }
    /**
     * Extracts user actions based on the given url.
     * Action can be one of those: keyword search, location search, route search, filtering.
     * The url of the last added action also provided for filtering extraction.
     * Returns the type of action and its representing text (keyword/location/route/filtering).
     * Input: URLs are URL objects.
     * Output: { type, label } or 'skip' if it's a redirect url.
     *
     * @param {String} prevUrlString
     * @param {String} urlString
     * @returns {Boolean|Null|{type: String, label: String}}
     */
    static extractUserAction(prevUrlString, urlString) {
        var searchEngine, filters = [],
            currentParams, prevParams,
            prevUrl, url, key;
        // check non-empty param urlString
        if (urlString) {
            url = new URL(urlString);
            searchEngine = this.detectSearchEngine(url);
            if (searchEngine) {
                return searchEngine;
            }
        } else {
            return null;
        }
        // check non-empty param prevUrlString
        if (prevUrlString) {
            prevUrl = new URL(prevUrlString);
            // Check if the current url and the previous url are the same except for the params (after hash).
            // If yes, a heuristic that the current item is from the same page with different params. Classify it as a filtering.
            if (this.removeQuery(url) !== this.removeQuery(prevUrl)) {
                return null;
            }
        } else {
            return null;
        }
        currentParams = SenseURL.getQueryStringFromSearch(url.search);
        prevParams = SenseURL.getQueryStringFromSearch(prevUrl.search);
        if (!currentParams && !prevParams) {
            return null;
        }
        // Three types: add, remove, update
        if (currentParams) {
            if (prevParams) {
                for (key in currentParams) {
                    let displayKey = '"' + key + '"';
                    if (key in prevParams) {
                        if (prevParams[key] !== currentParams[key]) { // Update
                            displayKey += ': from "' + decodeURIComponent(prevParams[key]);
                            displayKey += '" to "' + decodeURIComponent(currentParams[key]) + '"';
                            filters.push('change ' + displayKey);
                        }
                    } else { // Add
                        filters.push('add ' + displayKey + ': "' + decodeURIComponent(currentParams[key]) + '"');
                    }
                }
                for (key in prevParams) {
                    let displayKey = '"' + key + '"';
                    if (!(key in currentParams)) { // Remove
                        filters.push('remove ' + displayKey + ': "' + decodeURIComponent(prevParams[key]) + '"');
                    }
                }
            } else {
                // previous URL has no params, so all current params must have been added
                for (key in currentParams) {
                    let displayKey = '"' + key + '"';
                    // Add
                    filters.push('add ' + displayKey + ': "' + decodeURIComponent(currentParams[key]) + '"');
                }
            }
        } else {
            // current URL has no params, so all previous params must have been removed
            for (key in prevParams) {
                let displayKey = '"' + key + '"';
                // Remove
                filters.push('remove ' + displayKey + ': "' + decodeURIComponent(prevParams[key]) + '"');
            }
        }
        return filters.length ? {type: 'filter', label: filters.join('; ')} : null;
    }
    /**
     * Check if an url should be ignored
     *
     * @param {String} url
     * @returns {boolean}
     */
    static isUrlIgnored(url) {
        const ignoredUrls = [
            'chrome://', 'view-source:', 'chrome-extension://', 'chrome-devtools://',
            'google.co.uk/url', 'google.com/url',
            'localhost://'
        ];
        return ignoredUrls.some(u => url.includes(u));
    }
}
