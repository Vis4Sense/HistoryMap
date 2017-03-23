document.addEventListener("DOMContentLoaded", function() {
    // Data
    let data = { nodes: [], links: [] }, // Data for the vis, in tree format
        actions = []; // All actions added in temporal order

    // Options

    // Instantiate vis
    const historyMap = sm.vis.historyMap()
        .label(d => d.text)
        .icon(d => d.favIconUrl);

    // Provenance capture
    const browser = sm.provenance.browser()
        .on('dataChanged', _.throttle(onDataChanged, 100));

    // Converter from an array of actions to a tree
    const listToTree = sm.data.listToTree();

    // Rebuild vis when the window is resized
    window.onresize = _.throttle(updateVis, 100);

    function onDataChanged(action) {
        actions.push(action);
        data = listToTree(actions);
        updateVis();
    }

    function updateVis() {
        historyMap.width(window.innerWidth).height(window.innerHeight);
        d3.select('.sm-history-map-container').datum(data).call(historyMap);
    }
});