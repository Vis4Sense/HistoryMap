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
    // let nodes = []; // All actions added in temporal order
    // historyMap.model.nodes = [];
    nodes = historyMap.model.nodes;

    // Options

    // Instantiate vis
    const historyMapView = historyMap.view.vis()
        .label(d => d.text)
        .icon(d => d.favIconUrl);

    // Converter from an array of actions to a tree
    const listToTree = historyMap.model.listToTree();

    historyMap.view.redraw = function() {
        historyMap.model.tree = listToTree(nodes);
        historyMapView.width(window.innerWidth).height(window.innerHeight);
        d3.select('.sm-history-map-container').datum(historyMap.model.tree).call(historyMapView);
    }
    
    // Rebuild vis when the window is resized
    // window.onresize = _.throttle(updateVis, 100);

    // Provenance capture
    const historyMapController = historyMap.controller.browser();
    // .on('nodeCreated', onNodeCreated)
    // .on('titleUpdated', onTitleUpdated)
    // .on('favUpdated', onFavUpdated)
    // .on('typeUpdated', onTypeUpdated)
    // .on('urlUpdated', onUrlUpdated);
    
    // function onNodeCreated(node) {
    //     // console.log('createNode - tabId:'+node.tabId,', parent:'+node.from, ', url:'+node.url);
    //     nodes.push(node) ;
    //     redraw();
    // }

    // function onTitleUpdated(titleUpdate) {
    //     // console.log('updateNode -', nodeUpdate.text);
    //     nodes[titleUpdate.id].text = titleUpdate.text;
    //     redraw();
    // }

    // function onFavUpdated(favUpdate) {
    //     // console.log('updateNode -', nodeUpdate.text);
    //     nodes[favUpdate.id].favIconUrl = favUpdate.favUrl;
    //     redraw();
    // }

    // function onTypeUpdated(typeUpdate) {
    //     nodes[typeUpdate.id].type = typeUpdate.type;
    //     redraw();
    // }

    // function onUrlUpdated(urlUpdate) {
    //     nodes[urlUpdate.id].url = urlUpdate.url;
    // }
});