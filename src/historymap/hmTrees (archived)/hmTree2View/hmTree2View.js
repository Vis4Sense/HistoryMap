

// Create a root page for the d3 hierarchy as it does not allow multiple roots
const rootId = window.crypto.randomUUID();
const rootPage = new hmPage(
   rootId,
   null,
   new Date(),
   { title: "HistoryMap" },
   null
);
console.log("rootPage: ", rootPage);

function displayTree2(pages) {

   console.log("displayTree2");

   const plot = Plot.rectY({ length: 10000 }, Plot.binX({ y: "count" }, { x: Math.random })).plot();
   const div = document.querySelector("#myplot");
   div.innerHTML = "";
   div.append(plot);

   // Add all page without parent as children of the root
   const rootedPages = pages.map((d) => {
      if (!d.parentPageId) d.parentPageId = rootId;
      return d;
   });

   // add the new root to the array
   rootedPages.push(rootPage);

   console.log("rootedPages: ", rootedPages);

   // create d3 hierarchy with its stratify function
   const stratifiedPages = d3.stratify()
      .id((d) => d.pageId)
      .parentId((d) => d.parentPageId)
      (rootedPages);
   console.log("stratifiedPages: ", stratifiedPages);

   // createTree2(stratifiedPages)
   const plotTree = Plot.plot({
      axis: null,
      margin: 10,
      marginLeft: 40,
      marginRight: 160,
      width: 928,
      height: 500,
      marks: [
         Plot.tree(stratifiedPages)
      ]
   })
   const treeDiv = document.querySelector("#svg-div");
   treeDiv.innerHTML = "";
   treeDiv.append(plotTree);
};


function createTree2(data) {
   const width = 928;

   // Compute the tree height; this approach will allow the height of the
   // SVG to scale according to the breadth (width) of the tree layout.
   const root = d3.hierarchy(data);
   const dx = 10;
   const dy = width / (root.height + 1);

   // Create a tree layout.
   const tree = d3.tree().nodeSize([dx, dy]);

   // Sort the tree and apply the layout.
   root.sort((a, b) => d3.ascending(a.data.name, b.data.name));
   tree(root);

   // Compute the extent of the tree. Note that x and y are swapped here
   // because in the tree layout, x is the breadth, but when displayed, the
   // tree extends right rather than down.
   let x0 = Infinity;
   let x1 = -x0;
   root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
   });

   // Compute the adjusted height of the tree.
   const height = x1 - x0 + dx * 2;

   document.getElementById("svg-div").innerHTML = "";

   const svg = d3.select("#svg-div").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-dy / 3, x0 - dx, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

   const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll()
      .data(root.links())
      .join("path")
      .attr("d", d3.linkHorizontal()
         .x(d => d.y)
         .y(d => d.x));

   const node = svg.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll()
      .data(root.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.y},${d.x})`);

   node.append("circle")
      .attr("fill", d => d.children ? "#555" : "#999")
      .attr("r", 2.5);

   node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -6 : 6)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .clone(true).lower()
      .attr("stroke", "white");

   return svg.node();
}