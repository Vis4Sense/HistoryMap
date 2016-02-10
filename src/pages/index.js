$(function() {
    // Data
    var data = {}, // The data will be passed to the vis
        actions = [], // All actions added in temporal order including 'revisit' and 'child' actions
        pendingTasks = {}, // For jumping to an action when its page isn't ready yet
        name = '', // For quick test/analysis: preload data to save time loading files in the interface
        datasets = {
            p1: "data/p1.json",
            p2: 'data/latest.json'
        };

    // Vis and options
    var sensenav,
        showBrowser = true,
        listening = true;

    function run() {
        // Read options from saved settings
        chrome.storage.sync.get(null, items => {
            // Always listening now for easy testing
            listening = true;

            if (name) {
                // Load data
                d3.json(datasets[name], json => {
                    loadDataFile(json);
                    main();
                });
            } else {
                main();
            }
        });
    }

    function main() {
        sm.provenance.browser()
            .actions(actions)
            .capture()
            .on('dataChanged', () => {
                buildHierarchy(actions);
                redraw(true);
            });

        buildVis();
        updateVis();
        wheelHorizontalScroll();
    };

    run();

    function loadDataFile(json) {
        actions = json;
        buildHierarchy(actions);

        if (sensenav) {
            sensenav.actions(actions);
            redraw(true);
        }
    }

    function addLink(p, c) {
        if (!p.links) p.links = [];
        p.links.push(c);
        c.sup = p;
    };

    function addChild(p, c) {
        if (!p.children) p.children = [];
        p.children.push(c);
        c.parent = p;
    };

    // Convert flat list of actions to parent-children network, then redraw the vis.
    function buildHierarchy(actions) {
        // Init
        actions.forEach(n => {
            delete n.children;
            delete n.parent;
            delete n.links;
            delete n.sup;
        });

        // - Build parent-child relationship first
        actions.forEach((d, i) => {
            if (!i) return;

            // Add page linking as a type of link
            if (d.type === 'link') {
                var source = actions.find(d2 => d2.id === d.from);
                if (source) {
                    addLink(source, d);
                } else {
                    // console.log('could not find the source of ' + d.text);
                }
            }

            // If the action type of an item is embedded, add it as a child of the containing page
            if (isEmbeddedType(d.type)) {
                var source = actions.find(d2 => d2.id === d.from);
                if (source) {
                    addChild(source, d);
                } else {
                    // console.log('could not find the source of ' + d.text);
                }
            }
        });

        // - Ignore child actions
        data.nodes = actions.filter(n => !n.parent);

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
        data.nodes.forEach(d => {
            if (d.links) {
                d.links.forEach(c => {
                    if (data.nodes.includes(c)) data.links.push({ source: d, target: c });
                });
            }
        });

        // Sync current opening tabs and the vis
        data.nodes.forEach(n => { n.closed = true; });
        chrome.tabs.query({}, tabs => {
            tabs.forEach(t => {
                var n = actions.find(n => n.url === t.url);
                if (n) {
                    n.closed = false;
                    if (n.parent) n.parent.closed = false;
                }
            });
        });
    }

    function isEmbeddedType(type) {
        var embeddedTypes = [ "highlight", "note", "filter" ];
        return embeddedTypes.includes(type);
    }

    function respondToContentScript() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!listening) return;

            var tab = sender.tab;

            if (request.type === "dataRequested") {
                // Get highlights, notes for the requested item
                var tabData = actions.filter(d => d.url === tab.url);
                var t = tabData.map(getCoreData);
                sendResponse(t);
            } else if (request.type === "taskRequested") {
                if (pendingTasks[tab.id]) {
                    var t = getCoreData(pendingTasks[tab.id]);
                    sendResponse(t);
                    delete pendingTasks[tab.id];
                }
            }
        });
    }

    function respondToTabActivated() {
        chrome.tabs.onActivated.addListener(activeInfo => {
            if (!listening) return;

        	chrome.tabs.query({ windowId: activeInfo.windowId, active: true }, tabs => {
                if (!tabs.length) return;

                var tab = tabs[0];
        		if (tab.status !== "complete" || isTabIgnored(tab)) return;

                actions.forEach(n => {
                    n.highlighted = n.url === tab.url;
                    if (n.highlighted && n.parent) n.parent.highlighted = true;
                });

                addFirstTimeVisitPage(tab);
                redraw();
            });
        });
    }

    var timeoutId; // To prevent redraw multiple times

    function buildVis() {
        sensenav = sm.vis.sensedag()
            .label(d => d.text)
            .icon(d => d.favIconUrl)
            .on("itemClicked", jumpTo);

        // Register to update vis when the window is resized
        $(window).resize(() => {
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
        var timeFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
        $("#btnSave").click(function() {
            var date = timeFormat(new Date()),
                saveData = actions.map(getCoreData);
            $(this).attr("download", date + "_provenance.json")
                .attr("href", URL.createObjectURL(new Blob([JSON.stringify(saveData, null, 4)])));
        });

        $("#btnLoad").change(e => {
            sm.readUploadedFile(e, content => {
                loadDataFile(JSON.parse(content));
                redraw(true);
            });
        });
    }

    function getCoreData(d) {
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
        };
    }

    function replay() {
        var count = 1,
            intervalId = setInterval(() => {
                buildHierarchy(actions.slice(0, count));
                redraw(true);
                count++;

                if (count > actions.length) {
                    clearInterval(intervalId);
                }
            }, 1000);
    }

    function doGivenTab (url, callback) {
        chrome.tabs.query({}, tabs => {
            var tab = tabs.find(t => t.url === url);
            if (tab) {
                callback(tab);
            }
        });
    }

    function jumpTo(d) {
        if (showBrowser) {
            chrome.tabs.query({}, tabs => {
                var tab = tabs.find(t => t.url === d.url);
                if (tab) {
                    // Found it, tell content script to scroll to the element
                    chrome.tabs.update(tab.id, { active: true });
                    chrome.tabs.sendMessage(tab.id, { type: "scrollToElement", path: d.path, image: d.image });

                    // Get the tab/window in focused as well
                    chrome.windows.update(tab.windowId, { focused: true });

                } else {
                    // Can't find it, already closed, open new item, request scrolling later on
                    chrome.tabs.create({ url: d.url }, tab => {
                        chrome.windows.update(tab.windowId, { focused: true });
                        pendingTasks[tab.id] = d;
                    });
                }
            });
        }
    }

    function updateVis() {
        sensenav.width(window.innerWidth).height(window.innerHeight);
        redraw();
    }

    function redraw(dataChanged) {
        d3.select(".sm-sensemap-container").datum(data).call(sensenav);
    }

    function wheelHorizontalScroll() {
        var leftMouseDown = false,
            prevX;
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
});