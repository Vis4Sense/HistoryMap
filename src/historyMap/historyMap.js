const historyMap = function () {
    const historyMap = {
        model: {
            nodes: {},
            tree: {}, // real data
            tabs: {} // the status of the opened tabs in the browser
        },
        view: {
            vis: {},
            layout: {},
            redraw: {}
        },
        controller: {
            browser: {},
			highlightNodes:{}
        },
        database: { // saving and loading the historyMap sessions
            user: {},
            sessions: {},
            // DBSave: {},
            // DBLoad: {}
        }
    };
    return historyMap;
}();

var historyMapView;

document.addEventListener("DOMContentLoaded", function () {

    // Data
    nodes = historyMap.model.nodes.getArray();

    
    // Instantiate vis
    historyMapView = historyMap.view.vis()
        .label(d => d.text)
        .icon(d => d.favIconUrl);

    // Converter from an array of actions to a tree
    const listToTree = historyMap.model.listToTree();
    //historyMapVis -> listToTree -> historyMap
    listToTree.view('historyMap')
        .on('actionAdded', onActionAdded)
        .on('nodeClicked', onNodeClicked)
        .handleEvents(historyMapView);

    // Rebuild vis when the window is resized
    // window.onresize = _.throttle(updateVis, 100);

    historyMap.view.redraw = function () {
        historyMap.model.tree = listToTree(nodes);
        historyMapView.width(window.innerWidth).height(window.innerHeight);
        d3.select('.sm-history-map-container').datum(historyMap.model.tree).call(historyMapView);
    }

    function onNodeClicked(d) {
        //set all nodes .clicked value to false
        historyMap.model.nodes.setAllNodesClickedFalse();
        //set the most recently clicked node value to true
        d.clicked = true;
        chrome.tabs.query({}, tabs => {
            var tab = tabs.find(t => t.url === d.url);
            if (tab) {
                // Found it, tell content script to scroll to the element
                chrome.tabs.update(tab.id, {
                    active: true
                });
                chrome.tabs.sendMessage(tab.id, {
                    type: 'scrollToElement',
                    path: d.path,
                    image: d.image
                });
                // Get the tab/window in focused as well
                chrome.windows.update(tab.windowId, {
                    focused: true
                });
                //if the clicked on node is not an embedded (annotation) node
                if (d.embedded == undefined) {
                    //tab was found, therefore it is open (redundant?)
                    d.tabStatus = "opened";
                }
            } else {
                // Can't find it, already closed, open new item, request scrolling later on
                chrome.tabs.create({
                    url: d.url
                }, tab => {
                    chrome.windows.update(tab.windowId, {
                        focused: true
                    });
                    //pendingTasks[tab.id] = d; no longer defined
                    
                    //if the clicked on node is not an embedded (annotation) node
                    if (d.embedded == undefined) {
                        d.tabStatus = "opened";
                    }
                });
            }
        });
    }

    function onActionAdded(d) {
        d.time = new Date(d.time);
        nodes.push(d);
    }

    // Provenance capture
    const historyMapController = historyMap.controller.browser();

    const highlightNodes = historyMap.controller.highlightNodes();

});