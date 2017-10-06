document.addEventListener("DOMContentLoaded", function() {

    // Data
    let nodes = []; // All actions added in temporal order

    // Options

    // Instantiate vis
    const historyMap = sm.vis.historyMap()
        .label(d => d.text)
        .icon(d => d.favIconUrl);

    // Provenance capture
    const browser = sm.provenance.browser()
        .on('nodeCreated', onNodeCreated)
        .on('titleUpdated', onTitleUpdated)
        .on('favUpdated', onFavUpdated)
        .on('typeUpdated', onTypeUpdated);

    // Converter from an array of actions to a tree
    const listToTree = sm.data.listToTree();

    // Rebuild vis when the window is resized
    window.onresize = _.throttle(updateVis, 100);

	// this is where they are passing the information to visuals to create it.
	//{"id":1492234782998,"time":"2017-04-15T05:39:42.998Z","url":"https://getonepush.com/demo/","text":"Demo | OnePush","type":"link","favIconUrl":"https://getonepush.com/wp-content/themes/onepush/images/favicon.ico"}
	//{"id":1492234796532,"time":"2017-04-15T05:39:56.532Z","url":"https://getonepush.com/push/","text":"Push | OnePush","type":"link","favIconUrl":"https://getonepush.com/wp-content/themes/onepush/images/favicon.ico","from":1492234782998}
    // here ids are useds as reference.

	function onNodeCreated(node) {
        // console.log('createNode - tabId:'+node.tabId,', parent:'+node.from, ', url:'+node.url);
        
        //login functionality
        if (AccLoggedIn == true && UserRecord == true){
            nodes.push(node);
            
            var url  = "https://sensemap-api.herokuapp.com/node/"+DBSessionPointer+"/3yARG4zzLndmE39Mw00xigqDV3lOrjEJ/";
            var json = JSON.stringify(node);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
            xhr.onload = function () {
                var users = JSON.parse(xhr.responseText);
                if (xhr.readyState == 4 && xhr.status == "201") {
                    console.table(users);
                } else {
                    console.error(users);
                    console.log("Success")
                }
            }
            xhr.send(json);


        }

        redraw();
    }

    function onTitleUpdated(titleUpdate) {
        // console.log('updateNode -', nodeUpdate.text);
        nodes[titleUpdate.id].text = titleUpdate.text;
        redraw();
    }

    function onFavUpdated(favUpdate) {
        // console.log('updateNode -', nodeUpdate.text);
        nodes[favUpdate.id].favIconUrl = favUpdate.favUrl;
        redraw();
    }

    function onTypeUpdated(typeUpdate) {
        nodes[typeUpdate.id].type = typeUpdate.type;
        redraw();
    }

    function redraw() {
        sm.data.tree = listToTree(nodes);
        updateVis();
    }

    function updateVis() {
        historyMap.width(window.innerWidth).height(window.innerHeight);
        d3.select('.sm-history-map-container').datum(sm.data.tree).call(historyMap);
    }
});