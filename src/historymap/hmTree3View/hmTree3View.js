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

// Functions from parent page
const parentWindow = window.parent;
const handleOpenPage = parentWindow.handleOpenPage;

// Display tree
function displayTree(
   dataArray,
   displayElementId = "svg-div"
) {
   var data = [...dataArray],
      links,
      width,
      height,
      layout;

   layout = compactTreeLayout();
   calculateNodeSizes(data);
   layout.nodes(data).run().close();

   width = layout.width();
   height = layout.height();
   links = layout.links();

   const treeComponent = document.querySelector("tree-component");
   const svgDiv = treeComponent.getElementById(displayElementId);
   svgDiv.innerHTML = "";
   svgDiv.appendChild(renderTree({
      data,
      links,
      canvasWidth: width,
      canvasHeight: height,
   }));
}

window.displayTree = displayTree

function calculateNodeSizes(nodes) {
   const treeComponent = document.querySelector("tree-component");
   const hiddenDiv = treeComponent.getElementById("hidden-div");

   // Create shadow nodes to get the rendered size of the node
   nodes.forEach((d) => {
      const parentNode = d3.create("div")
         .html(customContent(hmPage2ItemInfo(d))).node();
      const node = parentNode.firstChild
      hiddenDiv.appendChild(node);
      const bbox = node.getBoundingClientRect();
      const { width, height } = bbox;
      d.width = width;
      d.height = height;
   })

   d3.select(hiddenDiv).selectAll("*").remove();
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
      isOpened: hmPage.isOpened,
      data: hmPage,
      parentPageId: hmPage.parentPageId,
      title: hmPage.pageObj.title,
      faviconUrl: hmPage.pageObj.favIconUrl,
      highlights: hmPage.highlights,
   }
}

function renderTree(
   {
      data,
      links,
      canvasWidth = 640,
      canvasHeight = 480,
      stroke = "#555", // stroke for links
      strokeWidth = 1.5, // stroke width for links
      strokeOpacity = 0.4, // stroke opacity for links
      strokeLinejoin, // stroke line join for links
      strokeLinecap, // stroke line cap for links
      curve = d3.curveBumpX, // curve for the link
   } = {}
) {
   // Create svg
   const svg = d3
      .create("svg")
      .attr("width", canvasWidth)
      .attr("height", canvasHeight);

   // Draw links
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
   const node = svg
      .append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .style("cursor", "pointer")
      .on("click", (_, d) => handleOpenPage(d));

   // Node content
   node.append("foreignObject")
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .html((d) => customContent(hmPage2ItemInfo(d)));

   // Forward back icon
   const forwardBack = node
      .filter((d) => d.forwardBack.back > 0)
      .append("g")
      .attr("transform", (d) => `translate(-8, ${d.height / 2})`);
   forwardBack // forward
      .filter((d) => d.forwardBack.forward > 0)
      .append("path")
      .attr("d", trianglePath(8, "right"))
      .attr("fill", "black")
      .attr("transform", "translate(7, 0)");
   forwardBack.append("path") // back
      .attr("d", trianglePath(8, "left"))
      .attr("fill", "black")
      .attr("transform", "translate(-7, 0)");
   forwardBack.append("circle")
      .attr("r", 6)
      .attr("fill", "white")
      .attr("stroke", "black")
   forwardBack.append("text")
      .attr("y", 3)
      .attr("font-size", 10)
      .style("text-anchor", "middle")
      .text((d) => `${d.forwardBack.back}`);
   forwardBack
      .attr("opacity", d => d.isOpened ? 1 : 0.2)

   return svg.node();
}

function trianglePath(length=10, direction="right") {
   const height = length * 1.2 / 2;
   if (direction === "left") {
      return `M 0 ${-length / 2} L ${-height} 0 L 0 ${length / 2} Z`;
   } else if (direction === "right") {
      return `M 0 ${-length / 2} L ${height} 0 L 0 ${length / 2} Z`;
   }
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

   /** text highlights
    * given an array of highlights
    * return divs of highlighted text
    */
   function textHighlights(highlights) {
      let highlightsHTML = "";
      const textHighlights = highlights.filter((h) => h.type === "highlightText");
      if (textHighlights && textHighlights.length > 0) {
         textHighlights.map((h) => {
            highlightsHTML += `
               <div class="item-highlight">
                  <div class="icon-brush">${iconBrush}</div>
                  <div title="${h.text}" class="item-highlight-text ellipsis" >${h.text}</div>
               </div>
            `;
         });
      }
      return highlightsHTML;
   }

   /**
    * image highlights
    * given an array of highlights
    * return divs of highlighted images
    */
   function imageHighlights(highlights) {
      let highlightsHTML = "";
      const imageHighlights = highlights.filter((h) => h.type === "highlightImage");
      if (imageHighlights && imageHighlights.length > 0) { // The first image is the main image
         const h1 = imageHighlights[0];
         // pre-calculate the height ratio to set the div size, restrict the height ratio to 100%
         const heightRatio = Math.min(Math.ceil(h1.imageHeight / h1.imageWidth * 100), 100);
         highlightsHTML += `
            <div class="item-highlight" style="padding-bottom: ${heightRatio}%;">
               <img src="${h1.imageBase64}" />
            </div>
         `;
      } if (imageHighlights && imageHighlights.length > 1) { // The rest are thumbnails
         highlightsHTML += `<div class="gallery">`;
         imageHighlights.slice(1).map((h) => {
            highlightsHTML += `
               <div class="gallery-item"">
                  <img src="${h.imageBase64}" />
               </div>
            `;
         });
         highlightsHTML += `</div>`;
      }
      return highlightsHTML;
   }

   return `<div class='item-contents-display boxed-item ${itemInfo.isOpened ? "opened" : "closed"}'>
      <div class="item-header">
         <div class='favicon'>
            <img class='favicon' src='${ itemInfo.faviconUrl || "./unknown-18-16.png" }'/>
         </div>
         <div class='item-title'>
            <div class='item-title-text' title='${ itemInfo.title || "Title"}'>
               ${itemInfo.title || "Title"}
            </div>
         </div>
      </div>
      <div class='item-highlights'>${imageHighlights(itemInfo.highlights)}</div>
      ${screenShot(itemInfo)}
      <div class='notes'>
      ${notes(itemInfo.notes)}
      </div>
      <div class='item-highlights'>${textHighlights(itemInfo.highlights)}</div>
      </div>
   `
}

const Tree3CSS = `
.hidden {
   visibility: hidden;
}

.ellipsis {
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
}

.hm-debug-historymap {
   background-color: azure;
}

.item-contents-display {
   padding: 2px;
   background-color: white;
   max-width: 10rem;
   font-size: 0.8rem;
}

.item-contents-display > div:not(:last-child) {
   margin-bottom: 0.3rem;
}

.item-contents-display .item-highlights > div:not(:last-child) {
   margin-bottom: 2px;
}

.item-header {
   display: flex;
   align-items: center;
   width: 100%;
}

.item-title {
   cursor: default;
   width: 100%;
}

.item-highlight {
   position: relative;
   display: flex;
   align-items: center;
   width: 100%;
}

.item-highlight .icon-brush {
   flex-shrink: 0;
   width: 1rem;
   height: 1rem;
   display: flex;
   align-items: center;
   justify-content: center;
   background-color: red;
   border-radius: 2px;
   margin-right: 0.2rem;
}

.item-highlight .icon {
   width: 0.7rem;
   height: 0.7rem;
}

.item-highlight .item-highlight-text {
   max-width: 90%;
   min-width: 30px;
}

.item-highlight img {
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   max-height: 100%;
   object-fit: cover;
}

.gallery {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(2rem, 1fr));
   gap: 1px;
 }
 
.gallery-item {
   width: 100%;
   height: 2rem;
}

.gallery-item img {
   width: 100%;
   height: 100%;
   object-fit: cover;
}

.item-title-text {
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
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
   margin-right: 0.2rem;
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
   border: 1px solid gray;
   border-radius: 4px;
   padding: 5px;
   margin-bottom: 2px;
   background-color: white;
   /* Sets the background color to white */
   /* box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.3); */
   /* Adds a shadow */
   width: 10rem;
}

.item-contents-display.boxed-item.closed {
   border: 1px dashed gray;
   opacity: 0.5;
}
`;

const iconBrush = `<svg t="1705761700978" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="28328" width="200" height="200"><path d="M334.06 618.68c-80.24 5.16-153.06 35.72-194.38 144.6-4.7 12.42-16 19.96-29.18 19.96-22.22 0-90.92-55.34-110.5-68.7C0.02 879.24 75.88 1024 256.02 1024c151.72 0 256-87.54 256-240.38 0-6.22-1.3-12.16-1.94-18.26l-176.02-146.68zM915.8 0c-30.32 0-58.74 13.42-80.42 32.9C426.56 398.1 384.02 406.68 384.02 514.18c0 27.4 6.5 53.52 17.46 77.4l127.64 106.36c14.42 3.6 29.28 6.06 44.78 6.06 124.22 0 196.22-90.94 422.32-512.92 14.76-28.7 27.8-59.7 27.8-91.98C1024.02 41.28 972.02 0 915.8 0z" p-id="28329" fill="#ffffff"></path></svg>`;
