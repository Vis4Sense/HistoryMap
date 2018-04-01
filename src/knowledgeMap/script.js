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
			newProduct.value = values[j];
		}
	}
	return newData;
}

var w = 500,
	h = 500;

var colorscale = d3.scale.category10();

//Legend titles
var LegendOptions = ['Smartphone','Tablet'];
//Data


var d = [
		  [
			{axis:"Effective Pixels",value:5},//12
			{axis:"Optical Zoom",value:1},//4
			{axis:"Screen Size",value:1}, //3
			//{axis:"Battery life",value:100},
		  ],[
			{axis:"Effective Pixels",value:16},
			{axis:"Optical Zoom",value:5},
			{axis:"Screen Size",value:3},
			//{axis:"Battery life",value:170},
		  ]
		];

//Options for the Radar chart, other than default
var mycfg = {
  w: w,
  h: h,
  maxValue: 1,
  levels: 10,
  ExtraWidthX: 300
}

//Call function to draw the Radar chart
//Will expect that data is in %'s
RadarChart.draw("#chart", d, mycfg);

////////////////////////////////////////////
/////////// Initiate legend ////////////////
////////////////////////////////////////////

var svg = d3.select('#body')
	.selectAll('svg')
	.append('svg')
	.attr("width", w+300)
	.attr("height", h)

//Create the title for the legend
var text = svg.append("text")
	.attr("class", "title")
	.attr('transform', 'translate(90,0)') 
	.attr("x", w - 70)
	.attr("y", 10)
	.attr("font-size", "12px")
	.attr("fill", "#404040")
	.text("What % of owners use a specific service in a week");
		
//Initiate Legend	
var legend = svg.append("g")
	.attr("class", "legend")
	.attr("height", 100)
	.attr("width", 200)
	.attr('transform', 'translate(90,20)') 
	;
	//Create colour squares
	legend.selectAll('rect')
	  .data(LegendOptions)
	  .enter()
	  .append("rect")
	  .attr("x", w - 65)
	  .attr("y", function(d, i){ return i * 20;})
	  .attr("width", 10)
	  .attr("height", 10)
	  .style("fill", function(d, i){ return colorscale(i);})
	  ;
	//Create text next to squares
	legend.selectAll('text')
	  .data(LegendOptions)
	  .enter()
	  .append("text")
	  .attr("x", w - 52)
	  .attr("y", function(d, i){ return i * 20 + 9;})
	  .attr("font-size", "11px")
	  .attr("fill", "#737373")
	  .text(function(d) { return d; })
	  ;	