$(function() {
    // Data
    var data = {}, // The data will be passed to the vis
        actions = [], // All actions added in temporal order including 'revisit' and 'child' actions
        browser = sm.provenance.browser(),
        startRecordingTime,
        pendingTasks = {}, // For jumping to an action when its page isn't ready yet
        name = '', // For quick test/analysis: preload data to save time loading files in the interface
        datasets = {
            p1: 'data/p1.json',
            p2: 'data/latest.json',
            image: 'data/image.json'
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
                startRecordingTime = new Date();
                main();
            }
        });
    }

    function main() {
        browser.actions(actions, function() {
            buildVis();
            updateVis();
            wheelHorizontalScroll();
        }).capture()
        .on('dataChanged', _.throttle(onDataChanged, 1000));
        // .on('dataChanged', onDataChanged);
    };

    function onDataChanged(p) {
        console.log(p, +new Date());
        buildHierarchy(actions);
        redraw(true);
    }

    run();

    var firstTime = true;
    function loadDataFile(json) {
        actions = json.data;
        buildHierarchy(actions);

        if (!firstTime) {
            browser.actions(actions, function() {
                if (sensenav) redraw(true);
            });
            firstTime = false;
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
        // Ignore 'revisit' actions for navigation
        _.remove(actions, a => a.type === 'revisit');

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
    }

    function isEmbeddedType(type) {
        return [ 'highlight', 'note', 'filter' ].includes(type);
    }

    function respondToContentScript() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!listening) return;

            var tab = sender.tab;

            if (request.type === 'dataRequested') {
                // Get highlights, notes for the requested item
                var tabData = actions.filter(d => d.url === tab.url);
                var t = tabData.map(getCoreData);
                sendResponse(t);
            } else if (request.type === 'taskRequested') {
                if (pendingTasks[tab.id]) {
                    var t = getCoreData(pendingTasks[tab.id]);
                    sendResponse(t);
                    delete pendingTasks[tab.id];
                }
            }
        });
    }

    function buildVis() {
        sensenav = sm.vis.sensedag()
            .label(d => d.text)
            .icon(d => d.favIconUrl)
            .on('itemClicked', jumpTo);

        $(window).resize(_.throttle(updateVis, 200));

        // Save and Load
        $(document).on('keydown', function(e) {
            if (!e.metaKey && !e.ctrlKey) return;

            var prevent = true;

            if (e.keyCode === 83) { // Ctrl + S
                saveFile();
            } else if (e.keyCode === 79) { // Ctrl + O
                $('#btnLoad').click();
            } else if (e.keyCode === 80) { // Ctrl + P
                replay();
            } else {
                prevent = false;
            }

            if (prevent) e.preventDefault();
        });

        // Settings
        $('#btnLoad').change(e => {
            sm.readUploadedFile(e, content => {
                loadDataFile(JSON.parse(content));
                redraw(true);
            });
        });
    }

    function saveFile() {
        // Images: replace dataURL with local files to reduce the size
        var coreData = actions.map(getCoreData);
        coreData.filter(d => d.image).forEach(d => {
            var filename = d.id + '.png';
            sm.saveDataToFile(filename, d.image, true);
            d.image = filename;
        });

        // Main file
        var timeFormat = d3.time.format('%Y-%m-%d %H:%M:%S'),
            date = timeFormat(new Date()),
            filename = date + '_sensemap.json';
        sm.saveDataToFile(filename, { startRecordingTime: startRecordingTime, data: coreData });
    }

    function getCoreData(d) {
        var action = {
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
            from: d.from,
            seen: d.seen
        };

        // Ignore undefined fields
        _.each(action, (value, key) => {
            if (value === undefined) delete action.key;
        });

        return action;
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

    function jumpTo(d) {
        if (showBrowser) {
            chrome.tabs.query({}, tabs => {
                var tab = tabs.find(t => t.url === d.url);
                if (tab) {
                    // Found it, tell content script to scroll to the element
                    chrome.tabs.update(tab.id, { active: true });
                    chrome.tabs.sendMessage(tab.id, { type: 'scrollToElement', path: d.path, image: d.image });

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
        d3.select('.sm-sensemap-container').datum(data).call(sensenav);
    }

    function wheelHorizontalScroll() {
        var leftMouseDown = false,
            prevX;
        $('body').on('wheel', function(e) {
            this.scrollLeft -= e.originalEvent.wheelDelta;
            e.preventDefault();
        }).on('mousedown', function(e) {
            if (e.which === 1) {
                leftMouseDown = true;
                prevX = e.clientX;
            }
        }).on('mouseup', function(e) {
            leftMouseDown = false;
        }).on('mousemove', function(e) {
            if (leftMouseDown && e.shiftKey) {
                this.scrollLeft -= e.clientX - prevX;
                prevX = e.clientX;
                e.preventDefault();
            }
        });
    }
});