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
		.insert("p", ":first-child").html(function(d){
            console.log("in append h1 data = ", d);
            return d.text;
        })
    }

    knowledgeMap.view.visualise = function (theDataToBeVisualised) {
        var boundedData = d3.select('body').selectAll("foreignObject").data(theDataToBeVisualised);
        console.log(boundedData);
        console.log(boundedData.enter());
        console.log(boundedData.exit());
        boundedData.enter().insert("p", ":first-child").html(function(d){
            console.log("the data available is", d);
            return d.title + "\n";
        })
    }

    //maybe should be in controller
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type === "knowledgeMapNode") {
            //add 2 elements
            knowledgeMapNodes.addNode(request.data);
        } else if (request.type === "visualiseData"){
            if(request.chart ==="radar"){
                console.log("visualising radar chart");
                var radarChartData = convertDataToBeUsedWithRadarChart(request.data);
				var radarChartOptions = radarChartSetup();
                RadarChart.draw("#chart", radarChartData, radarChartOptions);
            } else if (request.chart === "radarImproved"){
                console.log("visualising improved radar chart");
				var radarChartOptions = improvedRadarChartSetup();
                var radarChartData = convertDataToBeUsedWithRadarChart(request.data);
				ImprovedRadarChart("#chart", radarChartData, radarChartOptions);
			}
        }
    });
});