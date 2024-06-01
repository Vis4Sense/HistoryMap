/**
 * @fileoverview Draw HistoryMap tree view
 */

function hmTreeView({
    defaultLayoutMethod = 'indentedTree',
} = {}) {
    var module,
        hmPageArray,
        container,
        dummyContainer;

    var layoutMethod = defaultLayoutMethod;

    var parent = d => hmPageArray.find(p => p.pageId === d.parentPageId);

    function initialize() {
        container = document.getElementById('hm-tree-view');
    }

    function calculateNodeSizes(nodes) {
        dummyContainer = utils.dummyContainer();

        nodes.forEach(d => {
            const node = hmTreeNode(d).node();
            dummyContainer.appendChild(node);
            const bbox = node.getBoundingClientRect();
            d.width = bbox.width;
            d.height = bbox.height;
        })

        dummyContainer.remove();
    }

    function processData(nodes) {
        function isAncestorCollapsed(d) {
            let ancestor = parent(d);
            while (ancestor) {
                if (ancestor.isCollapsed) return true;
                ancestor = parent(ancestor);
            }
            return false;
        }

        function hasOpenedDescendants(d) {
            if (d.isOpened) return true;
            else if (d.isLeaf) return false;
            let children = nodes.filter(n => n.parentPageId === d.pageId);
            return children.find(n => hasOpenedDescendants(n)) !== undefined;
        }

        nodes.forEach((d) => {
            d.isLeaf = nodes.find((n) => n.parentPageId === d.pageId) === undefined;
            d.display = isAncestorCollapsed(d) ? false : true;
            d.isDescendantOpened = hasOpenedDescendants(d);
        });

        // Filter out collapsed nodes
        nodes = nodes.filter(d => d.display);

        return nodes;
    }

    function trianglePath(length=10, direction='right') {
        const height = length * 1.2 / 2;
        if (direction === 'left') {
           return `M 0 ${-length / 2} L ${-height} 0 L 0 ${length / 2} Z`;
        } else if (direction === 'right') {
           return `M 0 ${-length / 2} L ${height} 0 L 0 ${length / 2} Z`;
        }
    }

    function linkPath(link) {
        if (layoutMethod === 'compactTree') {
            link.attr(
                'd',
                d3
                    .link(d3.curveBumpX)
                    .x((d) => d.x)
                    .y((d) => d.y)
            )
        } else if (layoutMethod === 'indentedTree') {
            link.attr(
                'd',
                d => `
                    M ${d.source.x} ${d.source.y}
                    L ${d.source.x} ${d.target.y}
                    L ${d.target.x} ${d.target.y}
                `
            )
        } else {
            console.error(`Unknown layout method: ${layoutMethod}`);
        }
    }

    // TODO: refactor this function
    function displayTree({
        data,
        links,
        canvasWidth = 640,
        canvasHeight = 480,
        paddingRight = 200,
        paddingBottom = 20,
        stroke = '#555', // stroke for links
        strokeWidth = 1.5, // stroke width for links
        strokeOpacity = 1, // stroke opacity for links
        strokeLinejoin, // stroke line join for links
        strokeLinecap, // stroke line cap for links
    } = {}) {
        // Create svg
        const svg = d3
            .create('svg')
            .attr('width', canvasWidth + paddingRight)
            .attr('height', canvasHeight + paddingBottom);

        // Draw links
        svg
            .append('g')
            .attr('fill', 'none')
            .attr('stroke', stroke)
            .attr('stroke-opacity', strokeOpacity)
            .attr('stroke-linecap', strokeLinecap)
            .attr('stroke-linejoin', strokeLinejoin)
            .attr('stroke-width', strokeWidth)
            .selectAll('path')
            .data(links)
            .join('path')
            .call(linkPath);

        // Draw nodes
        const node = svg
            .append('g')
            .selectAll('g')
            .data(data)
            .join('g')
            .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

        // Node content
        node.append('foreignObject')
            .attr('width', (d) => d.width)
            .attr('height', (d) => d.height)
            .html((d) => hmTreeNode(d).node().outerHTML);

        // Interaction
        node
            .style('cursor', 'pointer')
            .on('click', (_, d) => handleOpenPage(d))
            .on('mouseenter', function () {
                // Append menu
                const nodeContent = d3.select(this).select('.hm-tree-node');
                const menu = hmNodeMenu(nodeContent);
                d3.select(this)
                    .append('g')
                    .attr('transform', d => `translate(${d.width}, 0)`)
                    .attr('class', 'menu')
                    .call(menu);
            })
            .on('mouseleave', function () {
                d3.select(this).select('.menu').remove();
            });

        // Collapse node
        node.select('.icon-collapse')
            .on('click', function (e, d) {
                e.stopPropagation();
                handleToggleCollapse(d.pageId);
            });

        // Forward back icon
        const forwardBack = node
            .filter((d) => d.forwardBack.back > 0)
            .append('g')
            .attr('transform', (d) => `translate(-8, ${d.height / 2})`);
        forwardBack // forward
            .filter((d) => d.forwardBack.forward > 0)
            .append('path')
            .attr('d', trianglePath(8, 'right'))
            .attr('fill', 'black')
            .attr('transform', 'translate(7, 0)');
        forwardBack.append('path') // back
            .attr('d', trianglePath(8, 'left'))
            .attr('fill', 'black')
            .attr('transform', 'translate(-7, 0)');
        forwardBack.append('circle')
            .attr('r', 6)
            .attr('fill', 'white')
            .attr('stroke', 'black')
        forwardBack.append('text')
            .attr('y', 3)
            .attr('font-size', 10)
            .style('text-anchor', 'middle')
            .text((d) => `${d.forwardBack.back}`);
        forwardBack
            .attr('opacity', d => d.isOpened ? 1 : 0.2)

        return svg.node();
    }

    initialize();

    return module = {
        hmPageArray: function (_) {
            return arguments.length ? (hmPageArray = _, module) : hmPageArray;
        },

        display: function () {
            var data = processData([...hmPageArray]),
                links,
                width,
                height,
                layout;

            // run compact tree layout
            layoutFunc = hmTreeLayouts[layoutMethod];
            layout = layoutFunc();
            calculateNodeSizes(data);
            layout.nodes(data).run();
            layout.close();

            // get links, canvas width, and canvas height
            links = layout.links();
            width = layout.width();
            height = layout.height();

            // display tree
            container.innerHTML = '';
            container.appendChild(displayTree({
                data,
                links,
                canvasWidth: width,
                canvasHeight: height,
            }));

            return module;
        },

        layoutMethod: function (_) {
            return arguments.length ? (layoutMethod = _, module) : layoutMethod;
        }
    }
}

function hmTreeNode(hmPage) {
    var module,
        node,
        nodeData;

    function hmPage2nodeData() {
        nodeData = {
            id: hmPage.pageId,
            isOpened: hmPage.isOpened,
            data: hmPage,
            parentPageId: hmPage.parentPageId,
            title: hmPage.pageObj.title,
            favIconUrl: hmPage.pageObj.favIconUrl,
            highlights: hmPage.highlights,
            tags: hmPage.tags,
            note: hmPage.note,
            isLeaf: hmPage.isLeaf,
            isCollapsed: hmPage.isCollapsed,
            isDescendantOpened: hmPage.isDescendantOpened,
        }
    }

    function initialize() {
        hmPage2nodeData();

        node = d3.create('div');
        node.datum(nodeData);
        node.attr('class', 'item-contents-display boxed-item hm-tree-node');
        node.classed('closed', !nodeData.isOpened);
        node.classed('semi-closed', d =>
            d.isCollapsed
            && !d.isOpened
            && d.isDescendantOpened
        );
        node.classed('favorite', d => d.tags.includes('favorite'));

        appendHeader();
        appendNote();
        appendHighlights();
    }

    /**
     * Append header to the node
     * 
     * <div class="item-header">
     *   <img src="faviconUrl">
     *   <span>title</span>
     * </div>
     */
    function appendHeader() {
        const header = node
            .append('div')
            .attr('class', 'item-header');

        header
            .filter(d => !d.isLeaf)
            .append('img')
            .attr('class', 'icon-collapse')
            .attr('src', d => d.isCollapsed
                ? utils.iconUrl('arrow-right')
                : utils.iconUrl('arrow-down')
            );

        header
            .append('img')
            .attr('src', d => d.favIconUrl || utils.iconUrl('question-circle'));

        header
            .append('span')
            .text(d => d.title);
    }

    /**
     * Append notes to the node
     */
    function appendNote() {
        const note = node
            .append('div')
            .attr('class', 'item-note')
            .text(d => d.note);
    }

    /**
     * Append highlights to the node
     * 
     * <div class="item-highlights">
     *   <div class="item-highlight">
     *     <div class="icon-brush"></div>
     *     <div class="item-highlight-text ellipsis">highlighted text</div>
     *   </div>
     * </div>
     */
    function appendHighlights() {
        const highlights = node
            .append('div')
            .attr('class', 'item-highlights');

        highlights
            .selectAll('.item-highlight')
            .data(d => d.highlights)
            .join('div')
            .attr('class', 'item-highlight')
            .call(appendHighlight);

        function appendHighlight(selection) {
            selection.append('div')
                .attr('class', 'icon-brush')
                .append('img')
                .attr('class', 'icon')
                .attr('src', utils.iconUrl('brush-fill'));
            selection.append('div')
                .attr('class', 'item-highlight-text ellipsis')
                .text(d => d.text);
        }
    }

    initialize();

    return module = {
        node: function () {
            return node.node();
        }
    }
}
