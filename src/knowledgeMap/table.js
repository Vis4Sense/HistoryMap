//register on click listeners to both buttons
document.getElementById("addAttribute").addEventListener("click", function(){
    console.log("adding another row");
    addEmptyRow();
});
document.getElementById("sendToKnowledgeMap").addEventListener("click", function(){
    console.log("clicked visualisation button ");
    var theTable = document.getElementById('testTable');
    var myJson = createJsonObjectFromTable(theTable);
    console.log(myJson);
    //send to km?
});

function getNumberOfCellsInARow(){
    var theHeaderRow = document.getElementById('tableHeader').getElementsByTagName("th");
    return theHeaderRow.length;
}

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

// unused
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

//unused
function getLastRow(){
    var rows = document.getElementById('testTable').getElementsByTagName("tr");
    var lastRow = rows[rows.length - 1];
    console.log(lastRow);
    return lastRow;
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

function setAllTableCellsToEditable(){
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
    for (var productIndex = 1; productIndex < headers.length; productIndex++){
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