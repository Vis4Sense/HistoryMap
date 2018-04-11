//register on click listeners to all buttons
document.getElementById("addAttribute").addEventListener("click", function(){
    console.log("adding another row");
    addEmptyRow();
});
document.getElementById("visualiseRadarChart").addEventListener("click", function(){
    console.log("visualising radarchart");
    var theTable = document.getElementById('testTable');
    var myJson = createJsonObjectFromTable(theTable);
    var productArray = convertToArray(myJson);
    chrome.runtime.sendMessage({type: "visualiseData", chart: "radar", data: productArray});
});
document.getElementById("visualiseImprovedRadarChart").addEventListener("click", function(){
    console.log("visualising improved radar chart");
    var theTable = document.getElementById('testTable');
    var myJson = createJsonObjectFromTable(theTable);
    var productArray = convertToArray(myJson);
    chrome.runtime.sendMessage({type: "visualiseData", chart: "radarImproved", data: productArray});
});

document.getElementById("sortProduct1Ascending").addEventListener("click", function(){
	sortTableRows(true, 0);
});

document.getElementById("sortProduct1Descending").addEventListener("click", function(){
	sortTableRows(false, 0);
});

document.getElementById("sortProduct2Ascending").addEventListener("click", function(){
	sortTableRows(true, 1);
});

document.getElementById("sortProduct2Descending").addEventListener("click", function(){
	sortTableRows(false, 1);
});

function getNumberOfCellsInARow(){
    var theHeaderRow = document.getElementById('tableHeader').getElementsByTagName("th");
    return theHeaderRow.length;
}

//adds an empty editable row at the end of the table 
function addEmptyRow(){
    console.log("running add e row");
    var numberOfElementsInARow = getNumberOfCellsInARow();
    var newRowIndex = getNumberOfExistingTableRows();
    var theTable = document.getElementById('testTable');
    var newRow = theTable.insertRow(newRowIndex);
    //add an empty row
    for(var i = 0; i < numberOfElementsInARow; i++){
        var newCell = newRow.insertCell(i);
        newCell.setAttribute("contenteditable", "true");
        //contenteditable='true'
    }
}

function getNumberOfExistingTableRows(){
    //all rows(including table header)
    return document.getElementById('testTable').getElementsByTagName("tr").length;
}

function setAllTableCellsToEditable(){
    //set all product title to editable
    var headers = document.getElementsByTagName("th");
    for (var i = 1; i < headers.length; i++){
        headers[i].setAttribute("contenteditable", "true")
    }
    //set all attributes to editable
    var cells = document.getElementsByTagName("td");
    for (var i = 0; i < cells.length; i++){
        cells[i].setAttribute("contenteditable", "true")
    }
}

//creates and returns a json object representation of the table
function createJsonObjectFromTable(tableElement){
    var myJson = {};
    var headers = document.getElementById("tableHeader").getElementsByTagName("th");
    //for each product in the table
    for (var productIndex = 2; productIndex < headers.length; productIndex++){
        //create a json object with a key of the product title (taken from heading of table)
        var productName = headers[productIndex].innerText;
        myJson[""+productName] = {};
        
        var attributes = document.getElementById("tableBody").getElementsByTagName("tr");
        //store each row in the json object product (key: attribute name, value: attribute value for that product)
        for (var attributeIndex = 0; attributeIndex < attributes.length; attributeIndex++){
            var currentAttribute = attributes[attributeIndex].getElementsByTagName("td");
            //get key and value for the product
            var attributeKey = currentAttribute[0].innerText;
            var attributeValue = currentAttribute[productIndex].innerText;
            //store under respective product
            myJson[productName][""+attributeKey] = attributeValue;
        }
    }
    return myJson;
}

//Order table rows according to product values for attributes

//gets the product attributevalues for a given product
function getProductAttributes(productColumnIndex){
	var arrayOfAttributes = [];
	var attributes = document.getElementById("tableBody").getElementsByTagName("tr");
	//store each row in the json object product (key: attribute name, value: attribute value for that product)
	for (var attributeIndex = 0; attributeIndex < attributes.length; attributeIndex++){
		var tempJson = {};
		var currentAttribute = attributes[attributeIndex].getElementsByTagName("td");
		//get key and value for the product
		var attributeKey = currentAttribute[0].innerText;
		var attributeValue = currentAttribute[productColumnIndex].innerText;
		//store under respective product
		tempJson.key = attributeKey;
		tempJson.value = parseInt(attributeValue);
		arrayOfAttributes.push(tempJson);
	}
	return arrayOfAttributes;
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

setAllTableCellsToEditable();

function sortTableRows(ascending, productColumnIndex){
	var temp = {};
	var swapsMade = true;
	var attributes = document.getElementById("tableBody").getElementsByTagName("tr");
	while (swapsMade){
		swapsMade = false;
		if (ascending){
			for(var i = 0; i < attributes.length - 1; i++){
				var currentRowValue = parseInt(attributes[i].getElementsByTagName("td")[productColumnIndex + 2].innerText);
				var nextRowValue = parseInt(attributes[i + 1].getElementsByTagName("td")[productColumnIndex + 2].innerText);
				if(currentRowValue > nextRowValue){
					console.log("a swap is made ascending");
					//swapping rows
					var theTableOfRows = attributes[i].parentNode;
					attributes[i].parentNode.insertBefore(attributes[i + 1], attributes[i]);
					swapsMade = true;
				}
			}
		} else {
			for(var i = 0; i < attributes.length - 1; i++){
				var currentRowValue = parseInt(attributes[i].getElementsByTagName("td")[productColumnIndex + 2].innerText);
				var nextRowValue = parseInt(attributes[i + 1].getElementsByTagName("td")[productColumnIndex + 2].innerText);
				if(currentRowValue < nextRowValue){
					console.log("a swap is made descending");
					//swapping rows
					var theTableOfRows = attributes[i].parentNode;
					attributes[i].parentNode.insertBefore(attributes[i + 1], attributes[i]);
					swapsMade = true;
				}
			}
		}
	}
}


function sortTableRowsBroken(productAttributes, ascending){
	var temp = {};
	var swapsMade = true;
	var attributes = document.getElementById("tableBody").getElementsByTagName("tr");
	
	while (swapsMade){
		swapsMade = false;
		if (ascending){
			for(var i = 0; i < productAttributes.length - 1; i++){
				if(productAttributes[i].value > productAttributes[i + 1].value){
					console.log("a swap is made ascending");
					//swapping attributes
					temp = productAttributes[i];
					productAttributes[i] = productAttributes[i + 1];
					productAttributes[i + 1] = temp;
					//swapping rows				
					//var row = attributes[i];
					//var nextRow = attributes[i + 1];
					console.log("row before");
					console.log(attributes[i].getElementsByTagName("td")[2].innerText);
					console.log("nextRow before");
					console.log(attributes[i + 1].getElementsByTagName("td")[2].innerText);
					var theTableOfRows = attributes[i].parentNode;
					attributes[i].parentNode.insertBefore(attributes[i + 1], attributes[i]);
					swapsMade = true;
					
					console.log("row after");
					console.log(attributes[i].getElementsByTagName("td")[2].innerText);
					console.log("nextRow after");
					console.log(attributes[i + 1].getElementsByTagName("td")[2].innerText);
				}
			}
		} else {
			for(var i = 0; i < productAttributes.length - 1; i++){
				if(productAttributes[i].value < productAttributes[i + 1].value){
					console.log("swap made descending");
					//swapping attributes
					temp = productAttributes[i];
					productAttributes[i] = productAttributes[i + 1];
					productAttributes[i + 1] = temp;
					//swapping rows				
					var theTableOfRows = attributes[i].parentNode;
					//this works in console where attributes is defined as above
					attributes[i].parentNode.insertBefore(attributes[i], attributes[i + 1]);
					swapsMade = true;
				}
			}
		}
	}
}

var product1 = getProductAttributes(2);

//product1 = ascendingProductAttributes(product1);
//sortTableRows(product1);
//sortTableRows(product1, true);
var product2 = getProductAttributes(3);

// unused
//adds a row to the table using the data given
function addRow(elementsToAdd){
    var numberOfElements = getNumberOfCellsInARow();
    var newTableRow = document.createElement("tr");
    for (var i = 0; i < numberOfElements; i++) {
        var tableDataCell = document.createElement("td");
        console.log(tableDataCell);
        var textNode = document.createTextNode(elementsToAdd[i]);
        console.log(textNode);
        tableDataCell.appendChild(textNode);
        newTableRow.appendChild(tableDataCell);
    }
    console.log(newTableRow);
    return newTableRow;
}

///////////////////////////////// unused////////////////////////////////////////////////////


function ascendingProductAttributes(productAttributes){
	var temp = {};
	var swapsMade = true;
	while (swapsMade){
		swapsMade = false;
		for(var i = 0; i < productAttributes.length - 1; i++){
			console.log("comparing " + productAttributes[i].value + " " + productAttributes[i + 1].value);
			console.log("indexes " + i + " " + (i + 1));
			console.log(productAttributes[i].value + " > " + productAttributes[i + 1].value + (productAttributes[i].value > productAttributes[i + 1].value));
			
			console.log(typeof productAttributes[i].value + " " + typeof productAttributes[i + 1].value); 
			if(productAttributes[i].value > productAttributes[i + 1].value){
				console.log(productAttributes[i].value + " > " + productAttributes[i + 1].value);
				temp = productAttributes[i];
				productAttributes[i] = productAttributes[i + 1];
				productAttributes[i + 1] = temp;
				console.log(productAttributes[i].value +" " + productAttributes[i+1].value);
				swapsMade = true;
			}
		}
	}
	return productAttributes;
}


//unused
function NOTsortTable(keysInOrder){
	var attributes = document.getElementById("tableBody").getElementsByTagName("tr");
	//store each row in the json object product (key: attribute name, value: attribute value for that product)
	for (var attributeIndex = 0; attributeIndex < attributes.length; attributeIndex++){
		var currentAttribute = attributes[attributeIndex].getElementsByTagName("td");
		//get key and value for the product
		var currentAttributeKey = currentAttribute[0].innerText;
		var currentOrderedKey = keysInOrder[attributeIndex].key;
		console.log(currentAttributeKey);
		console.log(currentOrderedKey);
		if (currentOrderedKey != currentAttributeKey){
			var indexToMoveAttributeKeyTo = -1;
			//find index key which matches currentOrderedKey
			for(var j = 0; j < attributes.length; j++){
				var currentAttribute = attributes[attributeIndex].getElementsByTagName("td");
				//get key and value for the product
				var currentAttributeKey = currentAttribute[0].innerText;
				if (currentAttributeKey == currentOrderedKey){
					indexToMoveAttributeKeyTo = j;
				}
			}
			console.log("not the same...where to move");
			console.log("move table key from index " + indexToMoveAttributeKeyTo + " to " + attributeIndex);
		}
	}
	
	//var parentNode = rows[RowLocation].parentNode;
	//parentNode.insertBefore(rows[RowLocation], rows[RowLocation - 1]);
}
function descendingProductAttributes(productAttributes){
	var temp = {};
	var swapsMade = true;
	while (swapsMade){
		swapsMade = false;
		for(var i = 0; i < productAttributes.length - 1; i++){
			if(productAttributes[i].value < productAttributes[i + 1].value){
				temp = productAttributes[i];
				productAttributes[i] = productAttributes[i + 1];
				productAttributes[i + 1] = temp;
				console.log(productAttributes[i].value +" " + productAttributes[i+1].value);
				swapsMade = true;
			}
		}
	}
	return productAttributes;
}
function addRow(elementsToAdd){
    var numberOfElementsInARow = getNumberOfCellsInARow();
    var newRowIndex = getNumberOfExistingTableRows();
    var theTable = document.getElementById('testTable');
    var newRow = theTable.insertRow(newRowIndex);
    if (!elementsToAdd){
        //add an empty row
        elementsToAdd = [];
            for(var i = 0; i < numberOfElementsInARow; i++){
            var newCell = newRow.insertCell(i);
            newCell.innerHTML = elementsToAdd[i];
        }
        return;
    } else {
        //add elements in row (up to the maximum cell (ignore extras)
        var numberOfElementsInARow = getNumberOfCellsInARow();
        var newRowIndex = getNumberOfExistingTableRows();
        var theTable = document.getElementById('testTable');
        var newRow = theTable.insertRow(newRowIndex);
        var index = (elementsToAdd.length < numberOfElementsInARow)? elementsToAdd.length:numberOfElementsInARow;
        console.log(elementsToAdd.length, numberOfElementsInARow);
        console.log(index);
        for(var i = 0; i < index; i++){
            var newCell = newRow.insertCell(i);
            newCell.innerHTML = elementsToAdd[i];
        }
        addRow();
    }
}

//unused
//adds a row of input text boxes at the end of the table
function addBlankInputRow(){
    var numberOfInputBoxes = getNumberOfCellsInARow();
    //this row should be blank
    var lastRowIndex = (getNumberOfExistingTableRows() - 1);
    var blankRowIndex = lastRowIndex + 1;
    console.log(blankRowIndex);
    var newTableRow = document.createElement("tr");
    for(var i = 0; i < numberOfInputBoxes; i++){
        var x = document.createElement("INPUT");
        x.setAttribute("type", "text");
        newTableRow.appendChild(x);
    }
    document.getElementById('testTable').appendChild(newTableRow);
}

//unused
function getLastRow(){
    var rows = document.getElementById('testTable').getElementsByTagName("tr");
    var lastRow = rows[rows.length - 1];
    console.log(lastRow);
    return lastRow;
}