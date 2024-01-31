(function() {
  let _itemsIndex = {}
  function renderTree(hierarchyInformation){
    let { rootElement = "root", orientation, items, customContent } = hierarchyInformation
    const element = document.getElementById(rootElement)

    const orientations = ["horizontal", "vertical", "centered"]
    if (!orientations.includes(orientation)) orientation = "horizontal"
    orientations.forEach(o => element.classList.remove(o));
    element.classList.add(orientation);
    element.innerHTML = items ? displayItems(items, customContent) : "No Items Array";
    return _itemsIndex
  }

  function displayItems(items, customContent) {
    let nodesHTML = "";
    _itemsIndex = {};
    const item = items[0]
    item.rootItem = true
    item.customContent = item.customContent || customContent
    nodesHTML += Item(item);
    return nodesHTML;
  }
  
  /* Parent
  Given the itemInfo and parentInfo
  Returns HTML for the item and all items.
  */
  function Item(itemInfo){
    const parentInfo = itemInfo.parent;
    if (_itemsIndex[`item-${itemInfo.id}`]) console.error("duplicate IDs:", itemInfo.id, "already exists")
    _itemsIndex[`item-${itemInfo.id}`] = itemInfo
    const childrenClass =
      itemInfo.items && itemInfo.items.length && !itemInfo.hideChildren ? "" : "no-items";
    return `
    <div id='item-${itemInfo.id}' class='item ${siblingClass(itemInfo, parentInfo)} ${childrenClass}'>

      <div class='item-contents'>
        ${contents(itemInfo)}
      </div>
      <div class='items-container ${itemInfo.hideChildren ? "invisible" : ""}'>
        ${ Items(itemInfo)}
      </div>
    </div>
    `;
  }

  /* items
  Given the parent, returns the rendered items as HTML
  */
  function Items(parent){
    const items = parent.items;
    let cHTML = ''
    if (items && items.length > 0) items.forEach((item, i) => {
      //if (i > 1) return
      item.parent = parent;
      item.customContent = parent.customContent;
      cHTML += Item(item);    
    });
    return cHTML;
  }

  /* siblingClass
  Given itemInfo and parentInfo, returns the class needed to relate the item to siblings.
  */
  function siblingClass(itemInfo){
    const parentInfo = itemInfo.parent;
    let sibling = "orphan";
    if (parentInfo === undefined || parentInfo.items === undefined){
    } else if (parentInfo.items.length === 1){
      sibling = "only-child";
    } else if (parentInfo.items[0].id == itemInfo.id) {
        sibling = "first-child"
    } else if (parentInfo.items[parentInfo.items.length - 1].id == itemInfo.id){
        sibling = "last-child"
    } else if (parentInfo.items.length > 1){
        sibling = "middle-child"
    }
    return sibling;
  }

  // This is the default content rendering for an item
  function contents(itemInfo){
    // If there is a title, use it, otherwise use the id
    function defaultTitle(itemInfo){
      const title = itemInfo.title || itemInfo.id
      return `<div class='item-contents-display'>
      <div class='item-title-text' title='${title}'>
        ${title}
        </div></div>`
    }

    return itemInfo.customContent ? itemInfo.customContent(itemInfo) : defaultTitle(itemInfo)
  }  

  function clearCustomContent () {
    const keys = Object.keys(_itemsIndex)
    keys.forEach((key) => _itemsIndex[key].customContent = undefined)
  }
  function itemsIndex(){
    return _itemsIndex
  }
  if (window) {
    window.Simple_Tree = { renderTree, clearCustomContent, itemsIndex }
    window.renderTree = renderTree
  }
  
})();

