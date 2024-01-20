// Define tree component
class TreeComponent extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
         <style>
         ${Tree3CSS}
         </style>
         <div id="svg-debug" class="hm-debug-historymap"></div>
         <div id="svg-div"></div>
         <div id="hidden-div" class="hidden"></div>
      `;
   }

   // Shadow element cannot be selected from outside
   getElementById(id) {
      return this.shadowRoot.getElementById(id);
   }
}

customElements.define('tree-component', TreeComponent);

// Display tree
function displayTree(
   dataArray,
   displayElementId = "svg-div"
) {
   // Create a root object for the tree
   const rootId = window.crypto.randomUUID();
   const root = new hmPage(
      rootId,
      null,
      new Date(),
      {
         title: "Tabs opened since opening History Map",
         label: "History Map",
      },
      null
   );

   // Kai: I am not sure what the code does.
   const treeData = [root, ...dataArray]
   const controls = {
      id: (d, n) => d.pageId,
      label: (d, n) => (d.pageObj.label ? d.pageObj.label : d.pageObj.title).slice(0,50),
      // If there is no parent, hang it off the root
      parentId: (d, n) =>
      // If there is a parentID return it, if make the parent the root (except for the root)
      {
         const pId = d.parentPageId
            ? d.parentPageId
            : d.pageId == rootId // If the page is the root, it has no parent
               ? null // No parent
               : rootId; // Default to root 
         // console.log(d, pId);
         return pId;
      },
      title: (d, n) => d.pageObj.title,
      link: (d, n) => d.pageObj.url,
      width: 1152,

      // following controls are added by Yuhan
      strokeWidth: 1,
      nodeWidth: 160,
      nodePaddingX: 20,
      nodePaddingY: 5,
   };

   const treeComponent = document.querySelector("tree-component");
   const svgDiv = treeComponent.getElementById(displayElementId);
   svgDiv.innerHTML = "";
   svgDiv.appendChild(Tree3(treeData, controls));
}

function playSession(duration=1000) {
   // Starting from empty hmPages
   const curHmPages = [];

   // Debug div id
   const debugDivId = "svg-debug";

   // Progressively add pages
   savedHmPages.forEach((page, idx) => {
       setTimeout(() => {
           curHmPages.push(page);
           displayTree(curHmPages, debugDivId)
       }, duration * idx);
   });
}

// Transform hmPage to itemInfo, which is the input of customContent
function hmPage2ItemInfo (hmPage) { 
   return {
      id: hmPage.pageId,
      data: hmPage,
      parentPageId: hmPage.parentPageId,
      title: hmPage.pageObj.title,
      faviconUrl: hmPage.pageObj.favIconUrl,
   }
}

// Yuhan: The layout calculation is temporarily customized to horizontal tree
// i.e., the root width is set by node height

// Recursively calculate the height of the tree
function calTreeWidth (root) {
   let h = 0;
   // Leaf node
   if (!("children" in root) || root.children.length == 0) {
      root["width"] = root.data.nodeSize.height;
      return;
   }
   // Internal node
   for (let i in root.children) {
     this.calTreeWidth(root.children[i]);
     h += root.children[i].width;
   }
   root["width"] = h;
}

// Recursively calculate tree layout, offset means the y position of each subtree,
// cover means the proportion the subtree occupies in the root tree
function calTreeLayout (root) {
   let offset = root.offset;
   let cover = root.cover;
   for (let i in root.children) {
     root.children[i]["offset"] = offset;
     let c = cover * root.children[i].width / root.width;
     offset += c;
     root.children[i]["cover"] = c;
     this.calTreeLayout(root.children[i]);
   }
}

function Tree3(
   data,
   {
      // data is either tabular (array of objects) or hierarchy (nested objects)
      path, // as an alternative to id and parentId, returns an array identifier, imputing internal nodes
      id = Array.isArray(data) ? (d) => d.id : null, // if tabular data, given a d in data, returns a unique identifier (string)
      parentId = Array.isArray(data) ? (d) => d.parentId : null, // if tabular data, given a node d, returns its parent’s identifier
      children, // if hierarchical data, given a d in data, returns its children
      tree = d3.tree, // layout algorithm (typically d3.tree or d3.cluster)
      sort, // how to sort nodes prior to layout (e.g., (a, b) => d3.descending(a.height, b.height))
      label, // given a node d, returns the display name
      title, // given a node d, returns its hover text
      link, // given a node d, its link (if any)
      linkTarget = "_blank", // the target attribute for links (if any)
      width = 640, // outer width, in pixels
      height, // outer height, in pixels
      r = 3, // radius of nodes
      padding = 1, // horizontal padding for first and last column
      fill = "#999", // fill for nodes
      fillOpacity, // fill opacity for nodes
      stroke = "#555", // stroke for links
      strokeWidth = 1.5, // stroke width for links
      strokeOpacity = 0.4, // stroke opacity for links
      strokeLinejoin, // stroke line join for links
      strokeLinecap, // stroke line cap for links
      halo = "#fff", // color of label halo
      haloWidth = 3, // padding around the labels
      verticalOffset,
      curve = d3.curveBumpX, // curve for the link

      // The following attributes are added by Yuhan
      nodeWidth = 160, // width of each node
      nodePaddingX = 20, // horizontal spacing between nodes
      nodePaddingY = 5, // vertical spacing between nodes
   } = {}
) {
   const treeComponent = document.querySelector("tree-component");
   const hiddenDiv = treeComponent.getElementById("hidden-div");

   // Create shadow nodes to get the rendered size of the node
   const shadowNodeRects = data.map((d) => {
      const parentNode = d3.create("div")
         .html(customContent(hmPage2ItemInfo(d))).node();
      const node = parentNode.firstChild
      hiddenDiv.appendChild(node);
      const bbox = node.getBoundingClientRect();
      const { width, height } = bbox;
      return { width, height };
   });

   d3.select(hiddenDiv).selectAll("*").remove();

   // Yuhan: assume that all nodes have the same width
   nodeWidth = shadowNodeRects[0].width || nodeWidth;

   // Yuhan: to enbale spaces between nodes, padding is added to the node size,
   // it will be removed when drawing the nodes
   const data_ = data.map((d, i) => {
      return {
         ...d,
         nodeSize: {
            width: shadowNodeRects[i].width + nodePaddingX * 2,
            height: shadowNodeRects[i].height + nodePaddingY * 2
         }
      }
   });

   const root =
      path != null
         ? d3.stratify().path(path)(data_)
         : id != null || parentId != null
            ? d3.stratify().id(id).parentId(parentId)(data_)
            : d3.hierarchy(data_, children);

   // Sort the nodes.
   if (sort != null) root.sort(sort);

   // Compute labels and titles.
   const descendants = root.descendants();
   const L = label == null ? null : descendants.map((d) => label(d.data, d));

   // Compute the layout

   // Yuhan: temporarily I do not use viewbox so the root cover is the exact
   // height of the node
   calTreeWidth(root);
   root["offset"] = 0;
   root["cover"] = root.width;
   calTreeLayout(root);

   // Drawing the tree

   // Yuhan: the size of the canvas fits the tree for now, and it is customized
   // to a horizontal tree

   // Calculate canvas size
   const canvasWidth = (root.height + 1) * (nodeWidth + nodePaddingX * 2);
   const canvasHeight = root.width;

   // Create svg
   const svg = d3
      .create("svg")
      .attr("width", canvasWidth)
      .attr("height", canvasHeight);

   // Draw links
   const links = root.links().map((d) => {
      const source = d.source;
      const target = d.target;
      const sx = (source.depth + 1) * (nodeWidth + nodePaddingX * 2) - nodePaddingX;
      const sy = source.offset + source.cover / 2;
      const tx = target.depth * (nodeWidth + nodePaddingX * 2) + nodePaddingX;
      const ty = target.offset + target.cover / 2;
      return {
         source: {...source, x: sx, y: sy},
         target: {...target, x: tx, y: ty}
      }
   });

   svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", stroke)
      .attr("stroke-opacity", strokeOpacity)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-width", strokeWidth)
      .selectAll("path")
      .data(links)
      .join("path")
      .attr(
         "d",
         d3
            .link(curve)
            .x((d) => d.x)
            .y((d) => d.y)
      );

   // Draw nodes
   svg
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(
         ${(d.depth) * (nodeWidth + nodePaddingX * 2) + nodePaddingX},
         ${d.offset + d.cover / 2 - d.data.nodeSize.height / 2 + nodePaddingY}
      )`)
      .append("a")
      .attr("xlink:href", link == null ? null : (d) => link(d.data, d))
      .attr("target", link == null ? null : linkTarget)
      .append("foreignObject")
      .attr("width", (d) => d.data.nodeSize.width)
      .attr("height", (d) => d.data.nodeSize.height)
      .html((d) => customContent(hmPage2ItemInfo(d.data)))

   return svg.node();
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
         <div class='favicon'>
            <img class='favicon' src='${ itemInfo.faviconUrl || "./simple_html_tree/unknown-18-16.png" }'/>
         </div>
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

const Tree3CSS = `
.hidden {
   visibility: hidden;
}

.hm-debug-historymap {
   background-color: azure;
}

.item-contents-display {
   padding: 2px;
   background-color: white;
   max-width: 10rem;
}

.item-header {
   display: flex;
   align-items: center;
   width: 100%;
}

.item-title {
   font-size: 0.8rem;
   cursor: default;
   width: 100%;
}

.item-title-text {
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
   max-width: 95%;
   max-width: 90%;
   min-width: 30px;
   cursor: default;
}

.favicon {
   width: 1rem;
   /* Adjust as needed */
   height: 1rem;
   /* Adjust as needed */
   margin-left: 0px;
   margin-right: 2px;
   margin-top: -1px;
} 
 
.screenshot {
   max-width: 100%;
   /* Ensures image does not exceed the width of its container */
   height: auto;
   /* Maintains aspect ratio */
}
 
.notes {
   list-style: none;
   padding: 0;
   margin: 0;
   cursor: default;
   display: none;
}
 
.note {
   margin-left: 1em;
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
}
 
.item-contents-display.boxed-item {
   border: 1px solid lightgray;
   padding: 5px;
   margin-bottom: 2px;
   background-color: white;
   /* Sets the background color to white */
   /* box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.3); */
   /* Adds a shadow */
   width: 10rem;
}
`;
