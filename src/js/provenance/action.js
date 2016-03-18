/**
 * action extracts 'action' based on the url.
 * Action can be one of those: keyword search, location search, route search, filtering.
 */
sm.provenance.action = function() {
    var module = {};

    // Templates for automatic action extraction
    var getGoogleLocation = function(url, pathname) {
        var trimUrl = url.pathname.substr(pathname.length + 1);
        return decodeURIComponent(trimUrl.substr(0, trimUrl.indexOf("/"))).replace(/\+/g, ' ');
    }, getOSMLocation = function(url) {
        // https://www.openstreetmap.org/search?query=london#map=12/51.5485/-0.2123
        var q = sm.getQueryStringFromSearch(url.search);
        return q ? q.query : q;
    }, getGoogleDirection = function(url, pathname) {
        // https://www.google.co.uk/maps/dir/The+World+Bank,+1818+H+Street+Northwest,+Washington,+DC+20433,+United+States/1914+Connecticut+Ave+NW,+Washington,+DC+20009,+USA/@38.9078884,-77.052622,15z/data=!4m14!4m13!1m5!1m1!1s0x89b7b7b0d7ea2d85:0x7c0ffdf15a217ec5!2m2!1d-77.042488!2d38.898932!1m5!1m1!1s0x89b7b7cfbe539997:0xf50e91ad60a7f906!2m2!1d-77.0464992!2d38.9162252!3e0
        var trimUrl = url.pathname.substr(pathname.length + 1),
            parts = trimUrl.split('/'),
            from = decodeURIComponent(parts[0]).replace(/\+/g, ' '),
            to = decodeURIComponent(parts[1]).replace(/\+/g, ' ');
        return !from || !to ? null : from + " to " + to;
    },
    keywordSearchTemplates = [
        {
            hostname: "www.google.",
            pathnames: [ "/", "/webhp", "/search", "/url" ],
            reg: /\Wq=([\w%+-]*)/ig
        }, {
            hostname: "www.bing.",
            pathnames: [ "/search" ],
            reg: /\Wq=([\w%+-]*)/i
        }, {
            hostname: "search.yahoo.",
            pathnames: [ "/search" ],
            reg: /\Wp=([\w%+-]*)/i
        }, {
            hostname: "ask.",
            pathnames: [ "/web" ],
            reg: /\Wq=([\w%+-]*)/i
        }, {
            hostname: "duckduckgo.",
            pathnames: [ "/" ],
            reg: /\Wq=([\w%+-]*)/i
        }, { // https://www.facebook.com/search/str/visualization/keywords_top
            hostname: "www.facebook.",
            pathnames: [ "/search/str" ],
            labelFunc: getGoogleLocation
        }, { // https://twitter.com/search?q=visualization&src=typd
            hostname: "twitter.",
            pathnames: [ "/search" ],
            reg: /\Wq=([\w%+-]*)/i
        }
    ],
    locationSearchTemplates = [
        {
            hostname: 'www.google.',
            pathname: '/maps/search',
            labelFunc: getGoogleLocation
        }, {
            hostname: 'www.google.',
            pathname: '/maps/place',
            labelFunc: getGoogleLocation
        }, {
            hostname: 'www.openstreetmap.',
            pathname: '/search',
            labelFunc: getOSMLocation
        }
    ],
    dirSearchTemplates = [
        {
            hostname: 'www.google.',
            pathname: '/maps/dir',
            labelFunc: getGoogleDirection
        }
    ];

    function detectSearch(url) {
        // Checks in order and return the first one match: keyword - location - route
        return detectKeyword(url) || detectLocation(url) || detectRoute(url);
    }

    // If a search doesn't have a keyword, don't capture it.
    // Return true if it's a search (hostname and pathname) but the query is empty.
    // If it's not a search, or a search with non-empty query, return false.
    function isEmptySearch(url) {
        var hostname = "www.google.",
            pathname = "/webhp",
            reg = /\Wq=([\w%+-]*)/ig;

        if (url.hostname.startsWith(hostname) && url.pathname.includes(pathname)) {
            var result = url.toString().match(reg);
            return !result || !result.length;
        }

        return false;
    }

    /**
     * Checks and returns the searching keyword if applicable.
     */
    function detectKeyword(url) {
        if (isEmptySearch(url)) return 'skip';

        for (var i = 0; i < keywordSearchTemplates.length; i++) {
            var t = keywordSearchTemplates[i];
            if (url.hostname.startsWith(t.hostname) && t.pathnames.some(d => url.pathname.includes(d))) {
                if (t.reg) {
                    var result = url.toString().match(t.reg);

                    if (!result || !result.length) return null;

                    var label = decodeURIComponent(result[result.length - 1]).replace(/\+/g, ' ');

                    // A quick fix for google search when it has both #q and q. Use 'g' to get all occurences, however they include #.
                    if (t.hostname === 'www.google.') label = label.substr(label.indexOf('=') + 1);

                    return { type: 'search', label: label };
                } else {
                    var label = t.labelFunc(url, t.pathnames[0]);
                    return label ? { type: 'search', label: label } : null;
                }
            }
        }

        return null;
    }

    /**
     * Checks and returns the searching location if applicable.
     */
    function detectLocation(url) {
        for (var i = 0; i < locationSearchTemplates.length; i++) {
            var t = locationSearchTemplates[i];
            if (url.hostname.startsWith(t.hostname) && url.pathname.includes(t.pathname)) {
                var label = t.labelFunc(url, t.pathname);
                return label ? { type: 'location', label: label } : null;
            }
        }

        return null;
    }

    /**
     * Checks and returns the searching route if applicable.
     */
    function detectRoute(url) {
        url = new URL(url);
        for (var i = 0; i < dirSearchTemplates.length; i++) {
            var t = dirSearchTemplates[i];
            if (url.hostname.startsWith(t.hostname) && url.pathname.includes(t.pathname)) {
                var label = t.labelFunc(url, t.pathname);
                return label ? { type: 'dir', label: label } : null;
            }
        }

        return null;
    }

    function detectFilter(prevUrl, url) {
        // Check if the current url and the previous url are the same except for the params (after hash).
        // If yes, a heuristic that the current item is from the same page with different params. Classify it as a filtering.
        if (!prevUrl || !url || removeHash(url) !== removeHash(prevUrl)) return null;

        var filters = [],
            currentParams = sm.getQueryStringFromSearch(url.search),
            prevParams = sm.getQueryStringFromSearch(prevUrl.search);

        if (!currentParams && !prevParams) return null;

        // Three types: add, remove, update
        if (currentParams) {
            if (prevParams) {
                for (var key in currentParams) {
                    if (key in prevParams) {
                        if (prevParams[key] !== currentParams[key]) { // Update
                            filters.push("change '" + key + "': from '" + decodeURIComponent(prevParams[key]) + "' to '" + decodeURIComponent(currentParams[key]) + "'");
                        }
                    } else { // Add
                        filters.push("add '" + key + "': '" + decodeURIComponent(currentParams[key]) + "'");
                    }
                }
                for (var key in prevParams) {
                    if (!(key in currentParams)) { // Remove
                        filters.push("remove '" + key + "': '" + decodeURIComponent(prevParams[key]) + "'");
                    }
                }
            } else {
                // previous URL has no params, so all current params must have been added
                for (var key in currentParams) {
                    // Add
                    filters.push("add '" + key + "': '" + decodeURIComponent(currentParams[key]) + "'");
                }
            }
        } else {
            // current URL has no params, so all previous params must have been removed
            for (var key in prevParams) {
                // Remove
                filters.push("remove '" + key + "': '" + decodeURIComponent(prevParams[key]) + "'");
            }
        }

        return filters.length ? { type: 'filter', label: filters.join('; ') } : null;
    }

    function removeHash(url) {
        // Remove hash as it's an anchor. A page can have many anchors, thus different url, but still one page.
        // However, removing is not correct in this case:
        // https://www.google.co.uk/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=other%20search%20engines
        // Solution: store all full urls and compare each of them with the address. Not have time to do it now.
        return url.origin + url.pathname;
    }

    /**
     * Extracts user actions based on the given url.
     * The url of the last added action also provided for filtering extraction.
     * Returns the type of action and its representing text (keyword/location/route/filtering).
     * Input: URLs are URL objects.
     * Output: { type, label } or 'skip' if it's a redirect url.
     */
    module.extract = function(prevUrl, url) {
        if (!url) return null;

        return detectSearch(url) || detectFilter(prevUrl, url);
    };

    return module;
};