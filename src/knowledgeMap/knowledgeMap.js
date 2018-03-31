const knowledgeMap = function () {
    const knowledgeMap = {
        model: {
            nodes: {},
        },
        view: {
            vis: {},
            redraw: {},
            visualise:{}
        },
        controller: {
            browser: {}
        }
    };
    return knowledgeMap;
}();

document.addEventListener("DOMContentLoaded", function () {
    // Data
    var knowledgeMapNodes = knowledgeMap.model.nodes;
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

    knowledgeMap.view.visualise = function (JsonData) {
        var theDataToBeVisualised = convertToArray(JsonData);
        console.log("visualising the data ", JsonData);
        var boundedData = d3.select('body').selectAll("foreignObject").data(theDataToBeVisualised);
        console.log(boundedData);
        console.log(boundedData.enter());
        console.log(boundedData.exit());
        boundedData.enter().insert("p", ":first-child").html(function(d){
            console.log("the data available is", d);
            return d.title + "\n";
        })
    }

    //converts nested products object to an array of products 
    function convertToArray(JsonData){
        var productArray = [];
        var productTitles = Object.keys(JsonData);
        var numberOfProducts = productTitles.length;
        var productAttributes = Object.values(JsonData);
        for(var i = 0;i<numberOfProducts; i++){
            var currentProduct = {};
            currentProduct.title = productTitles[i];
            currentProduct.attributes = productAttributes[i];
            productArray.push(currentProduct);
        }
        return productArray;
    }

    //maybe should be in controller
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type === "knowledgeMapNode") {
            //add 2 elements
            knowledgeMapNodes.addNode(request.data);
        } else if (request.type === "visualiseData"){
            knowledgeMap.view.visualise(request.data);
        }
    });
});