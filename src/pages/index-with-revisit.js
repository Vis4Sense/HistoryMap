$(function() {
    // Data
    var pendingTasks = {}, // For jumping to a note
        data = {},
        allNodes = [],
        // For quick test/analysis: preload data to save time loading files in the interface
        name = '', // Set to one of the participants below
        participants = {
            p1: "data/p1.json",
            p2: "data/p2.json"
        };

    var sensedag,
        lastActiveItem,
        lastAddItemTime,
        lastSearchAction,
        timeoutId, // To prevent redraw multiple times
        ignoredUrls = [ "chrome://", "chrome-extension://", "chrome-devtools://", "view-source:", "google.co.uk/url", "google.com/url", "localhost://" ],
        getGoogleLocation = function(url, pathname) {
            var trimUrl = url.pathname.substr(pathname.length + 1);
            return decodeURIComponent(trimUrl.substr(0, trimUrl.indexOf("/"))).replace(/\+/g, ' ');
        }, getOSMLocation = function(url) {
            // https://www.openstreetmap.org/search?query=london#map=12/51.5485/-0.2123
            var q = sm.getQueryStringFromSearch(url.search);
            return q ? q['query'] : q;
        }, getGoogleDirection = function(url, pathname) {
            // https://www.google.co.uk/maps/dir/The+World+Bank,+1818+H+Street+Northwest,+Washington,+DC+20433,+United+States/1914+Connecticut+Ave+NW,+Washington,+DC+20009,+USA/@38.9078884,-77.052622,15z/data=!4m14!4m13!1m5!1m1!1s0x89b7b7b0d7ea2d85:0x7c0ffdf15a217ec5!2m2!1d-77.042488!2d38.898932!1m5!1m1!1s0x89b7b7cfbe539997:0xf50e91ad60a7f906!2m2!1d-77.0464992!2d38.9162252!3e0
            var trimUrl = url.pathname.substr(pathname.length + 1);

            var index = trimUrl.indexOf("/");
            var fromUrl = trimUrl.substr(0, index);
            var toUrl = trimUrl.substr(index + 1);
            toUrl = toUrl.substr(0, toUrl.indexOf("/"));
            var from = decodeURIComponent(fromUrl).replace(/\+/g, ' ');
            var to = decodeURIComponent(toUrl).replace(/\+/g, ' ');
            return !from || !to ? "___one end empty___" : from + " to " + to;
        },
        keywordSearchTemplates = [
            {
                hostname: "www.google.",
                pathnames: [ "/", "/webhp", "/search", "/url" ],
                reg: /\Wq=([\w%+]*)/i
            }, {
                hostname: "www.bing.",
                pathnames: [ "/search" ],
                reg: /\Wq=([\w%+]*)/i
            }, {
                hostname: "search.yahoo.",
                pathnames: [ "/search" ],
                reg: /\Wp=([\w%+]*)/i
            }, {
                hostname: "ask.",
                pathnames: [ "/web" ],
                reg: /\Wq=([\w%+]*)/i
            }, {
                hostname: "duckduckgo.",
                pathnames: [ "/" ],
                reg: /\Wq=([\w%+]*)/i
            }, { // https://www.facebook.com/search/str/visualization/keywords_top
                hostname: "www.facebook.",
                pathnames: [ "/search/str" ],
                labelFunc: getGoogleLocation
            }, { // https://twitter.com/search?q=visualization&src=typd
                hostname: "twitter.",
                pathnames: [ "/search" ],
                reg: /\Wq=([\w%+]*)/i
            }, { // http://www.amazon.com/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=visualization
                hostname: "www.amazon.",
                pathnames: [ "/s" ],
                reg: /\Wfield-keywords=([\w%+]*)/i
            }, { // http://www.ebay.co.uk/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.Xvisualization.TRS0&_nkw=visualization&_sacat=0
                hostname: "www.ebay.",
                pathnames: [ "/sch"],
                reg: /\W_nkw=([\w%+]*)/i
            }, {
                hostname: "www.booking.",
                pathnames: [ "/"],
                reg: /\Wss=([\w%+]*)/i
            }, {
                hostname: "www.expedia.",
                pathnames: [ "/"],
                reg: /\Wdestination=([\w%+]*)/i
            }
        ],
        locationSearchTemplates = [
            {
                hostname: 'www.google.',
                pathname: '/maps/search',
                labelFunc: getGoogleLocation
            },
            {
                hostname: 'www.google.',
                pathname: '/maps/place',
                labelFunc: getGoogleLocation
            },
            {
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
        ],
        timeFormat = d3.time.format("%Y-%m-%d_%H-%M-%S"),
        followByBrowseActions = [ "search", "location", "place", "dir", "revisit", "link", "type", "bookmark", "unknown" ],
        embeddedTypes = [ "highlight", "note", "filter" ],
        visitedPages = {}, // Stores whether a page is visited
        tabRelationshipTypes = {}, // Stores how a tab is opened (revisit/link/type/bookmark)
        tabIdToDataItemLookup = {},
        showBrowser = true,
        listening = true;

    var main = function() {
        buildVis();
        updateVis();
        schedulePageReadingUpdate();
        wheelHorizontalScroll();
        syncWithTabs();
    };

    // Capture sensemaking actions
    respondToContentScript();
    respondToTabActivated();
    respondToTabUpdated();
    respondToTabClosed();

    // Read options from saved settings
    chrome.storage.sync.get(null, function(items) {
        // Always listening now for easy testing
        listening = true;

        if (name) {
            // Load data
            d3.json(participants[name], function(json) {
                loadDataFile(json);
                main();
            });
        } else {
            main();
        }
    });

    function loadDataFile(json) {
        // Acually, shouldn't save them in the first place
        allNodes = json;
        allNodes.forEach(function(d) {
            delete d.transcript;
            delete d.customTranscript;
            delete d.zoomLevel;
        });

        buildWorkspace();

        // Automatic infer links if not existed
        buildHierarchy(allNodes);
    }

    /**
     * Recreate lookups from data.
     */
    function buildWorkspace() {
        // This lookup keeps track of all visited pages to sync. between the vis and opening tabs and consider revisiting.
        visitedPages = {};

        allNodes.forEach(n => {
            visitedPages[removeHash(n.url)] = 1;
        });
    }

    function addLink(p, c) {
        if (!p.links) p.links = [];
        p.links.push(c);
    };

    function addChild(p, c) {
        if (!p.children) p.children = [];
        p.children.push(c);
        c.parent = p;
    };

    // Convert flat list of nodes to parent-children network
    function buildHierarchy(allNodes) {
        // Init
        allNodes.forEach(n => {
            delete n.parent;
            delete n.children;
            delete n.links;
        });

        var currentSource = allNodes[0];

        // - Build parent-child relationship first
        allNodes.forEach(function(d, i) {
            if (!i) return;

            // Add page linking as a type of link
            if (d.type === 'link') {
                var source = allNodes.find(d2 => d2.id === d.from);
                if (source) {
                    addLink(source, d);
                } else {
                    console.log(d);
                }
            }

            // If the action type of an item is embedded, add it as a child of the containing page
            if (embeddedTypes.includes(d.type)) {
                addChild(currentSource, d);
            } else if (d.type !== 'revisit') {
                currentSource = d;
            } else {
                // If the action type is 'revisit', remove it so that it's only shown once.
                // Also, if there're any embedded actions after that, set their parent to the item it's revisited.
                for (var j = 0; j < i; j++) { // The revisited item is the first one having the same url
                    if (allNodes[j].url === d.url) {
                        currentSource = allNodes[j];
                        if (currentSource.parent) currentSource = currentSource.parent;
                        break;
                    }
                }
            }
        });

        // - Ignore child and revisit nodes
        data.nodes = allNodes.filter(n => !n.parent && n.type !== 'revisit');

        // Specific for test data: add two semantic links
        if (name === 'p1') {
            var tv = data.nodes.find(n => n.text.startsWith('trivago.es'));
            var ri = data.nodes.find(n => n.text.startsWith('the river inn hotel'));
            var gh = data.nodes.find(n => n.text.startsWith('Grand Hyatt Washington washington dc'));

            if (tv && ri) addLink(tv, ri);
            if (tv && gh) addLink(tv, gh);
        }

        // - Then add to the link list
        data.links = [];
        data.nodes.forEach(function(d) {
            if (d.links) {
                d.links.forEach(function(c) {
                    if (data.nodes.includes(c)) data.links.push({ source: d, target: c });
                });
            }
        });

        // Sync current opening tabs and the vis
        data.nodes.forEach(n => { n.closed = true; });
        chrome.tabs.query({}, tabs => {
            tabs.forEach(t => {
                var n = data.nodes.find(n => removeHash(n.url) === removeHash(t.url));
                if (n) n.closed = false;
            });

            redraw();
        });
    }

    function respondToContentScript() {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (!listening) return;

            var tab = sender.tab;

            if (request.type === "dataRequested" || request.type === "taskRequested") { // No data change, no redraw
                if (request.type === "dataRequested") {
                    // Get highlights, notes for the requested item
                    var tabData = allNodes.filter(function(d) { return d.url === tab.url; });
                    var t = tabData.map(function(d) { return shallowClone(d); });
                    sendResponse(t);
                } else if (request.type === "taskRequested") {
                    if (pendingTasks[tab.id]) {
                        var t = shallowClone(pendingTasks[tab.id]);
                        sendResponse(t);
                        delete pendingTasks[tab.id];
                    }
                }
            } else { // Data change, redraw group
                if (request.type === "highlighted" || request.type === "noted") {
                    var item, itemIndex;
                    if (request.type === "highlighted") {
                        item = createNewItem(tab);
                        item.path = request.data.path;
                        item.type = "highlight";
                    } else {
                        // New item option
                        itemIndex = getItemIndex(tab.url, "classId", request.data.classId);
                        item = createNewItem(tab);
                        item.path = allNodes[itemIndex].path;
                        item.type = "note";

                        // New item or replace?
                        // itemIndex = getItemIndex(tab.url, "classId", request.data.classId);
                        // item = allNodes[itemIndex];
                        // item.type = "note";
                    }

                    item.classId = request.data.classId;
                    item.text = request.data.text;

                    buildHierarchy(allNodes);
                    redraw(true);
                } else if (request.type === "highlightRemoved") {
                    var itemIndex = getItemIndex(tab.url, "classId", request.classId);
                    var item = allNodes[itemIndex];
                    allNodes.splice(itemIndex, 1);
                    addChange({ id: +new Date(), action: item.type === "highlight" ? "remove-highlight" : "remove-note", index: itemIndex }, false);
                    redraw(true);
                }
            }
        });
    }

    function isBrowsingType(type) {
        return followByBrowseActions.indexOf(type) !== -1;
    }

    function createNewItem(tab) {
        var item = { time: new Date(), url: tab.url, text: tab.title, favIconUrl: tab.favIconUrl };
        item.id = +item.time;
        allNodes.push(item);

        return item;
    }

    function getItemIndex(value1, name2, value2) {
        for (var i = 0; i < allNodes.length; i++) {
            if (removeHash(allNodes[i].url) === removeHash(value1) && (!name2 || allNodes[i][name2] === value2)) {
                return i;
            }
        }

        return -1;
    }

    function removeHash(_url) {
        // Remove hash as it's an anchor. A page can have many anchors, thus different url, but still one page.
        // However, removing is not correct in this case:
        // https://www.google.co.uk/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=other%20search%20engines
        // Solution: store all full urls and compare each of them with the address. Not have time to do it now.
        // var url;
        // try {
        //     url = new URL(_url);
        // } finally {
        //     return url ? url.origin + url.pathname : _url;
        // }

        return _url;
    }

    function isTabIgnored(tab) {
        return ignoredUrls.some(function(url) { return tab.url.indexOf(url) !== -1; });
    }

    function respondToTabActivated() {
        chrome.tabs.onActivated.addListener(function(activeInfo) {
            if (!listening) return;

        	chrome.tabs.query({ windowId: activeInfo.windowId, active: true }, function(tabs) {
                if (!tabs.length) return;

                var tab = tabs[0];
        		if (tab.status !== "complete" || isTabIgnored(tab)) return;

                addItemRoot(tab);
            });
        });
    }

    function respondToTabClosed() {
        chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
            var itemIndex = getItemIndex(tabIdToDataItemLookup[tabId]);
            if (itemIndex !== -1) {
                allNodes[itemIndex].closed = true;
                redraw();
            }
        });
    }

    /**
     * Special case for 'webhp' redirect in google search.
     */
    function checkSearchRedirect(tab) {
        var hostname = "www.google.",
            pathnames = [ "/", "/webhp", "/search", "/url" ],
            reg = /\Wq=([\w%+]*)/i;

        var url = new URL(tab.url);
        if (url.hostname.startsWith(hostname) && pathnames.some(function(d) { return url.pathname.indexOf(d) !== -1; })) {
            var result = tab.url.match(reg);
            return result && result.length;
        }

        return true;
    }

    /**
     * Checks and returns the type of action and its representing text (corresponding for each type: keyword/location/route/filtering).
     */
    function getSearchAction(tab) {
        // Checks in order and return the first one match: keyword - location - route - filtering
        return getKeywordSearch(tab) || getLocationSearch(tab) || getRouteSearch(tab);
    }

    /**
     * Checks and returns the searching keyword if applicable.
     */
    function getKeywordSearch(tab) {
        var url = new URL(tab.url);
        for (var i = 0; i < keywordSearchTemplates.length; i++) {
            var t = keywordSearchTemplates[i];
            if (url.hostname.indexOf(t.hostname) !== -1 && t.pathnames.some(function(d) { return url.pathname.indexOf(d) !== -1; })) {
                if (t.reg) {
                    var result = tab.url.match(t.reg);
                    return (!result || !result.length) ? null : { type: 'search', label: decodeURIComponent(result[result.length - 1]).replace(/\+/g, ' ') };
                } else {
                    var label = t.labelFunc(url, t.pathnames[0]);
                    if (label) return { type: 'search', label: label };
                    return null;
                }
            }
        }

        return null;
    }

    /**
     * Checks and returns the searching location if applicable.
     */
    function getLocationSearch(tab) {
        var url = new URL(tab.url);
        for (var i = 0; i < locationSearchTemplates.length; i++) {
            var t = locationSearchTemplates[i];
            if (url.hostname.indexOf(t.hostname) !== -1 && url.pathname.indexOf(t.pathname) !== -1) {
                var label = t.labelFunc(url, t.pathname);
                if (label) return { type: 'location', label: label };
                return null;
            }
        }

        return null;
    }

    /**
     * Checks and returns the searching route if applicable.
     */
    function getRouteSearch(tab) {
        var url = new URL(tab.url);
        for (var i = 0; i < dirSearchTemplates.length; i++) {
            var t = dirSearchTemplates[i];
            if (url.hostname.indexOf(t.hostname) !== -1 && url.pathname.indexOf(t.pathname) !== -1) {
                var label = t.labelFunc(url, t.pathname);
                if (label) return { type: 'dir', label: label };
                return null;
            }
        }

        return null;
    }

    function addFirstTimeVisitPage(tab) {
        var searchAction = getSearchAction(tab);
        var type = searchAction ? searchAction.type : tabRelationshipTypes[tab.url + "-" + tab.id];
        type = type || 'unknown';

        if (type === 'link') {
            chrome.tabs.sendMessage(tab.id, { type: "askReferrer" }, function(response) {
                var referral = allNodes.slice().reverse().find(n => n.url.startsWith(response));
                addItem(tab, type, referral);
            });
        } else {
            addItem(tab, type);
        }
    }

    function addItem(tab, type, referral) {
        if (!listening) return;

        // Less than 1s, it must be some redirect, don't add it?
        // console.log(new Date() - lastAddItemTime);
        // if (lastAddItemTime && (new Date() - lastAddItemTime < 2000)) return;

        console.log(checkSearchRedirect(tab))
        if (!checkSearchRedirect(tab)) return;

        var searchAction = getSearchAction(tab);

        // In some search engines, pages reloaded when zoom and pan, causing multiple actions generated.
        // Need to detect and merge those actions into one. The last url is updated to the merged action.
        var merged = getLocationSearch(tab) && lastSearchAction && searchAction && searchAction.label === lastSearchAction.label;

        lastSearchAction = searchAction;

        if (searchAction && searchAction.label === "___one end empty___") return;

        var item = merged ? lastActiveItem : { time: new Date(), url: tab.url, text: searchAction ? searchAction.label : tab.title, type: type, favIconUrl: tab.favIconUrl };
        lastAddItemTime = item.time;
        if (!merged) item.id = +item.time;
        if (isBrowsingType(type)) item.endTime = new Date(+item.time + 1000);

        // Check if the current item having the same url but the params are different with the previous one.
        // If yes, a heuristic that the current item is from the same page with different params. Classify it as a filtering.
        if (lastActiveItem) {
            var currentUrl = removeHash(tab.url);
            var prevUrl = removeHash(lastActiveItem.url);
            if (currentUrl === prevUrl) {
                var filters = [];
                var url = new URL(tab.url);
                var currentParams = sm.getQueryStringFromSearch(url.search);
                url = new URL(lastActiveItem.url);
                var prevParams = sm.getQueryStringFromSearch(url.search);

                if (!currentParams && !prevParams) return;

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

                if (filters.length) {
                    item.type = 'filter';
                    item.text = filters.join('; ');
                }
            }
        }

        lastActiveItem = item;

        if (!merged) {
            allNodes.push(item);
            if (referral) item.from = referral.id;
        }

        buildHierarchy(allNodes);

        redraw(true);
    }

    function respondToTabUpdated() {
        // When tab is already activated
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (!listening) return;

            if (tab.status !== "complete" || isTabIgnored(tab)) return;

            // Page can be reloaded when faviconurl is changed from content script. Detect and ignore it.
            if (changeInfo && _.size(changeInfo) === 1 && changeInfo.favIconUrl) return;

            // Record how to open this page. It doesn't need to be active.
            chrome.history.getVisits({ url: tab.url }, function(results) {
                if (!results || !results.length) return;

                // The latest one contains information about the just completely loaded page
                var visitItem = results[0];
                var bookmarkTypes = [ "auto_bookmark" ];
                var typedTypes = [ "typed", "generated", "keyword", "keyword_generated" ];

                if (bookmarkTypes.indexOf(visitItem.transition) !== -1) {
                    tabRelationshipTypes[tab.url + "-" + tab.id] = "bookmark";
                } else if (typedTypes.indexOf(visitItem.transition) !== -1) {
                    tabRelationshipTypes[tab.url + "-" + tab.id] = "type";
                } else {
                    tabRelationshipTypes[tab.url + "-" + tab.id] = "link";
                }

                if (tab.active) addItemRoot(tab);
            });

            // Record to use later in finding url of closing page
            tabIdToDataItemLookup[tabId] = tab.url;
        });
    }

    function addItemRoot(tab) {
        // When a tab is activated, add a new item
        //  if the page has been opened before, set it as 'revisit'
        //  if not, set the page relationship as how it's opened (tabRelationshipTypes)

        if (visitedPages[removeHash(tab.url)]) {
            addItem(tab, "revisit");
        } else {
            addFirstTimeVisitPage(tab);
            visitedPages[removeHash(tab.url)] = 1;
        }
    }

    function buildVis() {
        sensedag = sm.vis.sensedag()
            .label(d => d.text)
            .icon(d => d.favIconUrl)
            .on("itemHovered", onItemHovered)
            .on("itemUnhovered", onItemUnhovered)
            .on("itemClicked", jumpTo);

        // Register to update vis when the window is resized
        $(window).resize(function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(updateVis, 100);
        });

        // Save and Load
        $(document).on("keydown", function(e) {
            if (!e.metaKey && !e.ctrlKey) return;

            var prevent = true;

            if (e.keyCode === 83) { // Ctrl + S
                $("#btnSave").get(0).click();
            } else if (e.keyCode === 79) { // Ctrl + O
                $("#btnLoad").click();
            } else if (e.keyCode === 80) { // Ctrl + P
                replay();
            } else {
                prevent = false;
            }

            if (prevent) e.preventDefault();
        });

        // Settings
        $("#btnSave").click(function() {
            var date = timeFormat(new Date());
            var saveData = allNodes.map(cleanData);
            $(this).attr("download", date + "_provenance.json")
                .attr("href", URL.createObjectURL(new Blob([JSON.stringify(saveData)])));
        });

        $("#btnLoad").change(function(e) {
            sm.readUploadedFile(e, function(content) {
                loadDataFile(JSON.parse(content));
                redraw(true);
            });
        });
    }

    function cleanData(d) {
        return {
            id: d.id,
            text: d.text,
            url: d.url,
            type: d.type,
            time: d.time,
            endTime: d.endTime,
            favIconUrl: d.favIconUrl,
            classId: d.classId,
            path: d.path,
            image: d.image,
            from: d.from
        }
    }

    function replay() {
        var count = 1,
            intervalId = setInterval(() => {
                buildHierarchy(allNodes.slice(0, count));
                redraw(true);
                count++;

                if (count > allNodes.length) {
                    clearInterval(intervalId);
                }
            }, 1000);
    }

    function doGivenTab (url, callback) {
        chrome.tabs.query({}, tabs => {
            for (var i = 0; i < tabs.length; i++) {
                if (removeHash(tabs[i].url) === removeHash(url)) {
                    callback(tabs[i]);
                    return;
                }
            }
        });
    }

    function onItemHovered(d) {
        doGivenTab(d.url, function(tab) {
            chrome.tabs.sendMessage(tab.id, { type: "alertTab", icon: d.favIconUrl, title: d.text });
        });
    }

    function onItemUnhovered(d) {
        doGivenTab(d.url, function(tab) {
            chrome.tabs.sendMessage(tab.id, { type: "stopAlertTab", icon: d.favIconUrl, title: d.text });
        });
    }

    function jumpTo(d) {
        if (showBrowser) {
            chrome.tabs.query({}, function(tabs) {
                var windowId;
                for (var i = 0; i < tabs.length; i++) {
                    if (removeHash(tabs[i].url) === removeHash(d.url)) {
                        // Found it, tell content script to scroll to the element
                        chrome.tabs.update(tabs[i].id, { active: true });
                        chrome.tabs.sendMessage(tabs[i].id, { type: "scrollToElement", path: d.path, image: d.image });

                        // Get the tab/window in focused as well
                        chrome.windows.update(tabs[i].windowId, { focused: true });

                        return;
                    }
                }

                // Can't find it, already closed, open new item, request scrolling later on
                chrome.tabs.create({ url: d.url }, function(tab) {
                    chrome.windows.update(tab.windowId, { focused: true });
                    pendingTasks[tab.id] = d;
                });
            });
        }
    }

    function clone(d) {
         return $.extend(true, {}, d);
    }

    function shallowClone(d) {
        return { type: d.type, path: d.path, classId: d.classId, text: d.text, image: d.image };
    }

    function updateVis() {
        sensedag.width(window.innerWidth).height(window.innerHeight);
        redraw();
    }

    function redraw(dataChanged) {
        d3.select(".sm-sensemap-container").datum(data).call(sensedag);
    }

    function schedulePageReadingUpdate() {
        // After every a fix amount of seconds,
        // - gets the currently active tab in the browser
        // - updates reading time of the 'currently stored' active tab
        setInterval(function() {
            // Get active tab
            chrome.tabs.query({ active: true }, function(tabs) {
                var tab = tabs[0];
                if (!lastActiveItem || tab.status !== "complete" || isTabIgnored(tab)) return;

                var url = removeHash(tabs[0].url);
                if (getItemIndex(url) === -1) return; // The page still not captured

                if (isBrowsingType(lastActiveItem.type)) {
                    lastActiveItem.endTime = Math.max(lastActiveItem.endTime, new Date());
                }
            });
        }, 1000);
    }

    function wheelHorizontalScroll() {
        var leftMouseDown = false;
        var prevX;
        $("body").on("wheel", function(e) {
            this.scrollLeft -= e.originalEvent.wheelDelta;
            e.preventDefault();
        }).on("mousedown", function(e) {
            if (e.which === 1) {
                leftMouseDown = true;
                prevX = e.clientX;
            }
        }).on("mouseup", function(e) {
            leftMouseDown = false;
        }).on("mousemove", function(e) {
            if (leftMouseDown && e.shiftKey) {
                this.scrollLeft -= e.clientX - prevX;
                prevX = e.clientX;
                e.preventDefault();
            }
        });
    }

    function syncWithTabs() {
        chrome.tabs.onActivated.addListener(function(activeInfo) {
            chrome.tabs.query({ lastFocusedWindow: true, active: true }, function(details) {
                if (!details.length) return;

                var tab = details[0];
                allNodes.forEach(n => {
                    n.highlighted = removeHash(n.url) === removeHash(tab.url);
                    console.log(n.highlighted);
                });

                redraw();
            });
        });

        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (!listening) return;

            if (tab.status !== "complete" || isTabIgnored(tab)) return;

            if (tab.active) {
                allNodes.forEach(n => {
                    n.highlighted = n.url === tab.url;
                });
            }
        });
    }
});