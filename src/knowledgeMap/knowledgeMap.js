const knowledgeMap = function () {
    const knowledgeMap = {
        model: {
            nodes: {},
            tree: {}, // real data
            user: {},
            sessions: {}
        },
        view: {
            vis: {},
            layout: {},
            redraw: {}
        },
        controller: {
            browser: {}
        }
    };
    return knowledgeMap;
}();

document.addEventListener("DOMContentLoaded", function () {

    // Data
    nodes = knowledgeMap.model.nodes.getArray();

    // Instantiate vis
    const knowledgeMapView = knowledgeMap.view.vis()
        .label(d => d.text)
        .icon(d => d.favIconUrl);

    // Converter from an array of actions to a tree
    const listToTree = knowledgeMap.model.listToTree();
    //knowledgeMapVis -> listToTree -> knowledgeMap
    listToTree.view('knowledgeMap')
        .on('actionAdded', onActionAdded)
        .on('nodeClicked', onNodeClicked)
        .handleEvents(knowledgeMapView);

    // Rebuild vis when the window is resized
    // window.onresize = _.throttle(updateVis, 100);

    knowledgeMap.view.redraw = function () {
        knowledgeMap.model.tree = listToTree(nodes);
        knowledgeMapView.width(window.innerWidth).height(window.innerHeight);
        d3.select('.sm-knowledge-map-container').datum(knowledgeMap.model.tree).call(knowledgeMapView);
    }

    function onNodeClicked(d, exists) {
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
                    //pendingTasks[tab.id] = d; no longer defined
                });
            }
        });
    }

    function onActionAdded(d) {
        d.time = new Date(d.time);
        nodes.push(d);
    }

    // Provenance capture
    const knowledgeMapController = knowledgeMap.controller.browser();

});