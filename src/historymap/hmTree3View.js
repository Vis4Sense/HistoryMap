// copied from displayTree2
function displayTree3(
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
   // console.log("treeData", treeData);
   // const displayElement = document.getElementById("svg-div")
   const displayElement = document.getElementById(displayElementId)
   displayElement.innerHTML = "";
   displayElement.appendChild(Tree3(treeData, controls));
}

// Yuhan: I'm not sure which attribute name to use for the rendered size
// of the node, so just use nodeSize for now

// for reference only, not used
class hmPageWithSize extends hmPage {
   constructor(pageId, tabId, time, pageObj, parentPageId) {
      super(pageId, tabId, time, pageObj, parentPageId);
      this.nodeSize = {
         width: 40,
         height: 40
      }
   }
};

// Yuhan: The layout calculation is temporarily customized to vertical tree
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
   // Yuhan: the node width (`nodeWidth`) is fixed for now

   // Yuhan: to enbale spaces between nodes, padding is added to the node size,
   // it will be removed when drawing the node

   // Test only. Generate the rendered size of the node. Use a fixed size
   // for node width and randomly generate node height. See `pageObjWithSize`
   // for data format
   const data_ = data.map((d) => {
      return {
         ...d,
         nodeSize: d.nodeSize || {
            width: nodeWidth + nodePaddingX * 2,
            // height: Math.random() * 20 + 60 + nodePaddingY * 2

            // Yuhan: change it to a stable mapping
            height: ((d.pageObj.id || 0) % 10 + 1) * 2 + 60 + nodePaddingY * 2
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
   // to a vertical tree

   // Calculate canvas size
   const canvasWidth = (root.height + 1) * (nodeWidth + nodePaddingX * 2);
   const canvasHeight = root.width;

   // Create svg
   const svg = d3
      .create("svg")
      .attr("width", canvasWidth)
      .attr("height", canvasHeight);

   // console.log(root.links())

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
   const node = svg
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
      .attr("width", (d) => d.data.nodeSize.width - nodePaddingX * 2)
      .attr("height", (d) => d.data.nodeSize.height - nodePaddingY * 2);
   // node
   //    .append("rect")
   //    .attr("width", (d) => d.data.nodeSize.width - nodePaddingX * 2)
   //    .attr("height", (d) => d.data.nodeSize.height - nodePaddingY * 2)
   //    .attr("fill", "none")
   //    .attr("stroke", fill);
   
   // Yuhan: a temporal style setting for testing
   node
      .append("xhtml:div")
      .style("width", (d) => d.data.nodeSize.width - nodePaddingX * 2 + "px")
      .style("height", (d) => d.data.nodeSize.height - nodePaddingY * 2 + "px")
      .style("padding", "10px")
      .style("border", "1px dashed #999")
      .style("border-radius", "2px")
      .style("box-sizing", "border-box")
      .append("xhtml:div")
      .text((_, i) => L[i]);

   return svg.node();
}