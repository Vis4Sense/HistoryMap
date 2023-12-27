
  /* displayTree
    Given an array of hmPage objects
    1. Create a root object
    2. Map hmPage to Simple HTML Hierarchy data format
       a. Map data
       b. Establish relationships 
  */
function displayTree(dataArray) {
  /* prepDataArray
    array of hmPage objects
  */
  function prepDataArray(array){
    // Create a root object    
    const rootItem = {
      id: window.crypto.randomUUID(), 
      title: "Pages open at start or as new tab",
      faviconUrl: "./Google_Chrome.png", 
      data: {}, 
      items: []
    }
    // Prepare item and items for quick linking of children with parent
    const itemsIndexed = {}
    array.forEach((item)=> {
      // Transform each item to the rendered object
      if (itemsIndexed[item.pageId]) console.error(item.pageId, "is not unique.")
      itemsIndexed[item.pageId] = { 
        id: item.pageId, 
        data: item,
        parentPageId: item.parentPageId,
        title: item.pageObj.title,
        faviconUrl: item.pageObj.favIconUrl,
        items:[]
      }
    })
    // For each item, find the parent or set the root as parent
    Object.keys(itemsIndexed).forEach((key) =>{
      if (itemsIndexed[key].parentPageId) {
        itemsIndexed[itemsIndexed[key].parentPageId].items.push(itemsIndexed[key])
      } else {
        rootItem.items.push(itemsIndexed[key])
      }
    })
    return [rootItem]
  }
  const items = prepDataArray(dataArray)
  console.log("items:", items)
  let instructions = {
    rootElement: undefined, // will default to "root", 
    orientation: undefined, // horizontal, vertical, or centered
    customContent: customContent, // If provided, all items will render using the same customContent, unless an item has been assigned customerContent
    items 
  }
  indexedItems = Simple_Tree.renderTree(instructions);
}

function customContent(itemInfo) {
  /* children
  Given the pagInfo, returns the img HTML with the screenshot
  */
  function screenShot(itemInfo){
    return itemInfo && itemInfo.screenshotSrc
      ? `<img class='screeshot' src='${itemInfo.screenshotSrc}'/>`
      : ``;
  }

  /* notes
  given an array of notes
  return divs of the notes
  */
  function notes(notes){
    let notesHTML = ""
    if (notes && notes.length > 0){
      notes.map(n => {
        notesHTML += `<div title="${n}" class="note" >${n}</div>`;
      })
    }
    return notesHTML;
  }

  return `<div class='item-contents-display boxed-item'>
    <div class="item-header">
    <img class='favicon' src='${ itemInfo.faviconUrl || "./unknown-18-16.png" }'/>
    <div class='item-title'>
      <div class='item-title-text' title='${ itemInfo.title || "Title"}'>
        ${itemInfo.title || "Title"}
      </div>
    </div>
    </div>
    ${screenShot(itemInfo)}
    <div class='notes'>
    ${notes(itemInfo.notes)}
    </div>
    </div>
  `
}
