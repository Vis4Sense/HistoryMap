function convertDataToBeUsedWithRadarChart(tableData){
	var newData=[];
	for (var i = 0; i < tableData.length; i++){
		var currentProduct = tableData[i].attributes;
		var keys = Object.keys(currentProduct);
		var values = Object.values(currentProduct);
		var numberOfAttributes = keys.length;
		var tempArray =[];
		newData.push(tempArray);
		for(var j = 0; j < numberOfAttributes; j++){
			var newProduct = {};
			tempArray.push(newProduct);
			newProduct.axis = keys[j];
			newProduct.value = parseInt(values[j]);
		}
	}
	return newData;
}
//Legend titles
var LegendOptions = ['Smartphone','Tablet'];

var d = [
		  
		  [
			{axis:"Effective Pixels",value:16},
			{axis:"Optical Zoom",value:5},
			{axis:"Screen Size",value:3},
			//{axis:"Battery life",value:170},
		  ],[
			{axis:"Effective Pixels",value:12},
			{axis:"Optical Zoom",value:4},
			{axis:"Screen Size",value:3},
			//{axis:"Battery life",value:100},
		  ]
		];

//default setup

function radarChartSetup(){
	var w = 500;
	var h = 500;
	
	//color for radar chart
	var colorscale = d3.scale.category10();
	
	var radarChartOptions = {
	  w: w,
	  h: h,
	  maxValue: 1,
	  levels: 10,
	  ExtraWidthX: 300
	};
	return radarChartOptions;
}

function improvedRadarChartSetup(){
	var margin = {top: 100, right: 100, bottom: 100, left: 100},
		width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
		height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

	var color = d3.scale.ordinal()
		.range(["#EDC951","#CC333F","#00A0B0"]);
		
	var radarChartOptions = {
	  w: width,
	  h: height,
	  margin: margin,
	  maxValue: 0.5,
	  levels: 5,
	  roundStrokes: true,
	  color: color
	};
	return radarChartOptions;
}

RadarChart.draw("#chart", d, radarChartSetup());