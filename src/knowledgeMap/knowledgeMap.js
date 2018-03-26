const knowledgeMap = function () {
    const knowledgeMap = {
        model: {
            nodes: {},
            tree: {}, // real data
            user: {},
            sessions: {}
        },
        view: {
            layout: {},
            vis: {},
            redraw: {}
        },
        controller: {
            browser: {}
        }
    };
    return knowledgeMap;
}();

document.addEventListener("DOMContentLoaded", function () {
	const knowledgeMapLayout = knowledgeMap.view.layout.grid;
    // Data
    var knowledgeMapNodes = knowledgeMap.model.nodes;//.getArray();
    // Instantiate vis

    knowledgeMap.view.redraw = function () {
        var theNodes = knowledgeMapNodes.nodes;
        console.log("redrawing providing these nodes as data", theNodes);
        /* this definiley works but doesn"t display the data due to svg taking up all the space in the body
        boundedData = d3.select('body').selectAll("foreignObject").data(theNodes);
        console.log(boundedData);
        console.log(boundedData.enter());
        console.log(boundedData.exit());
        boundedData.enter()
        .append("p").html(function(d){
            console.log("in append h1 data = ", d);
            return d.text;
        })
        */
        var boundedData = d3.select('body').selectAll("foreignObject").data(theNodes);
        console.log(boundedData);
        console.log(boundedData.enter());
        console.log(boundedData.exit());
        boundedData.enter()
        /*.append("p")*/.insert("p", ":first-child").html(function(d){
            console.log("in append h1 data = ", d);
            return d.text;
        })
    }

    //maybe should be in controller
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type === "knowledgeMapNode") {
            //add 2 elements
            knowledgeMapNodes.addNode(request.data);
        }
    });
});