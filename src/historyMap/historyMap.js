const historyMap = function() {
    const historyMap = {
        model: {
            nodes: [],
            tree: {} // real data
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

    return historyMap;
}();

document.addEventListener("DOMContentLoaded", function() {

    // Data
    nodes = historyMap.model.nodes;

    // Instantiate vis
    const historyMapView = historyMap.view.vis()
        .label(d => d.text)
        .icon(d => d.favIconUrl);

    // Converter from an array of actions to a tree
    const listToTree = historyMap.model.listToTree();

    // Rebuild vis when the window is resized
    // window.onresize = _.throttle(updateVis, 100);

    historyMap.view.redraw = function() {
        historyMap.model.tree = listToTree(nodes);
        historyMapView.width(window.innerWidth).height(window.innerHeight);
        d3.select('.sm-history-map-container').datum(historyMap.model.tree).call(historyMapView);
    }

    // Provenance capture
    const historyMapController = historyMap.controller.browser();

});