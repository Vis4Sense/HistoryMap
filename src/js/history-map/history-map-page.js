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

	// this is where they are passing the information to visuals to create it.
	//{"id":1492234782998,"time":"2017-04-15T05:39:42.998Z","url":"https://getonepush.com/demo/","text":"Demo | OnePush","type":"link","favIconUrl":"https://getonepush.com/wp-content/themes/onepush/images/favicon.ico"}
	//{"id":1492234796532,"time":"2017-04-15T05:39:56.532Z","url":"https://getonepush.com/push/","text":"Push | OnePush","type":"link","favIconUrl":"https://getonepush.com/wp-content/themes/onepush/images/favicon.ico","from":1492234782998}
    // here ids are useds as reference.
	
	function onDataChanged(action) {
		
			actions[action.counter] = action ;
			data = listToTree(actions);
			updateVis();
		
    }
	
    function updateVis() {
        historyMap.width(window.innerWidth).height(window.innerHeight);
        d3.select('.sm-history-map-container').datum(data).call(historyMap);
    }
});