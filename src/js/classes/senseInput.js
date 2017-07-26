/**
 * This class is created to serve inputs on the view
 *
 * Created by steve on 10/19/16.
 */
class SenseInput {
    /**
     * Create an instance to serve input tags on the views
     *
     * @param {Object} [options]
     */
    constructor(options) {
        this.options = options || {};
        this.nodes = [];
        this.links = [];
        this.autoTitle = '@';
        this.titleEditing = false;
    }
    /**
     * Auto generator of new titles
     *
     * @returns {String}
     */
    newTitle() {
        var lastPosition = this.autoTitle.length - 1,
            title = this.autoTitle.split('');
        if (!incWord(title, lastPosition)) {
            title.unshift('A');
        }
        this.autoTitle = title.join('');
        return this.autoTitle;
        /**
         * Recursion to incremental char at the pos to next symbol.
         * I.e A -> B; AA -> AB; AZZ -> BAA; Z, ZZ, ZZZ, ... -> false
         *
         * @param {Array} arr
         * @param {Number} pos
         * @returns {Boolean} true if successful incrementation
         */
        function incWord(arr, pos) {
            var charCode = arr[pos].charCodeAt(0), result = false;
            // Check if the symbol is equal or bigger than 'Z'
            if (charCode >= 90) {
                arr[pos] = 'A';
                if (pos > 0) {
                    result = incWord(arr, pos - 1);
                }
            } else {
                arr[pos] = String.fromCharCode(charCode + 1);
                result = true;
            }
            return result;
        }
    }
    /**
     * Update the arrays 'nodes' and 'links' to use in the function endTitleEditing
     *
     * @param {Array} nodes
     * @param {Array} links
     */
    updateNodesLinks(nodes, links) {
        this.nodes = nodes;
        this.links = links;
    }
    /**
     * Handle a click on empty space. If it appears the old title is restored
     */
    emptySpaceClick() {
        if (this.titleEditing) {
            let oldInput = d3.selectAll('.sm-sensemap input');
            if (oldInput.node()) {
                this.endTitleEditing(oldInput, true);
            }
        }
    }
    /**
     * Handle a keyboard event in the view
     *
     * @param {Number} keyCode
     * @param {Object} target
     */
    keyHandle(keyCode, target) {
        switch (keyCode) {
            case 27: // Esc
                if (this.titleEditing) {
                    this.endTitleEditing(d3.select(target), true);
                }
                break;
            case 13: // Enter
                if (this.titleEditing) {
                    this.endTitleEditing(d3.select(target), false);
                }
                break;
            default:
                // console.warn('Unknown key code: ' + e.keyCode);
                break;
        }
    }
    /**
     * Activate node title editing
     *
     * @param {Object} divLabel
     * @param {Object} node
     */
    clickNodeLabel(divLabel, node) {
        var maxWidth, input;
        divLabel = d3.select(divLabel);
        maxWidth = divLabel.style('max-width');
        d3.event.stopPropagation();
        // if the mode titleEditing is on the save the last input field
        if (this.titleEditing) {
            let oldInput = d3.selectAll('.sm-sensemap .node-label input');
            if (oldInput.node()) {
                if (oldInput.attr('data-id') == node.id) {
                    return;
                }
                this.endTitleEditing(oldInput, true);
            }
        }
        // Set the titleEditing mode on
        this.titleEditing = true;
        // Clean divLabel
        divLabel.text('');
        // Add the input tag to the div divLabel
        input = divLabel.append('xhtml:input').attr('type', 'text')
            .style('max-width', maxWidth)
            .attr('value', node.text).attr('data-id', node.id);
        input.node().autofocus = true;
    }
    /**
     * Finish title editing of active node. If the argument restore is true then the old title is restored
     *
     * @param {Object} selection
     * @param {Boolean} restore
     */
    endTitleEditing(selection, restore) {
        var id = selection.attr('data-id');
        if (id) {
            // todo need to get actual dataNodes
            let title, node, parent = d3.select(selection.node().parentNode),
                isNodeLabel = parent.classed('node-label');
            if (isNodeLabel) {
                node = this.nodes.find(n => n.id == id);
                title = restore ? node.text : selection.node().value;
            } else {
                node = this.links.find(n => n.id == id);
                title = restore ? this.titleText : selection.node().value;
            }
            node.text = title;
            selection.remove(); parent.text(title);
            this.titleEditing = false;
            if (!isNodeLabel) {
                let foreignObject = d3.select(parent.node().parentNode);
                foreignObject.attr('transform', this.getTitleTransform(parent, node));
            }
        }
    }
    /**
     * Get the transform attribute for the title div
     *
     * @param {Object} div
     * @param {Object} link
     * @returns {String}
     */
    getTitleTransform(div, link) {
        var clientRect, centerOfLink = [
            link.rpoints[0].x + (link.rpoints[1].x - link.rpoints[0].x) / 2,
            link.rpoints[0].y + (link.rpoints[1].y - link.rpoints[0].y) / 2
        ];
        if (div.node()) {
            clientRect = div.node().getBoundingClientRect();
            centerOfLink[0] = Math.round(centerOfLink[0] - clientRect.width / 2);
            centerOfLink[1] = Math.round(centerOfLink[1] - clientRect.height / 2);
        }
        return 'translate(' + centerOfLink + ')';
    }
    /**
     * Add the div block to the edge and remove the button 'Add title'
     *
     * @param {Object} link
     */
    addInputToEdge(link) {
        var titleObject;
        d3.event.stopPropagation();
        // Added a foreign object for a title
        var container = d3.select(d3.select('#' + SenseLink.linkId(link)).node().parentNode);
        titleObject = container.insert('foreignObject', ':nth-child(3)')
            .attr('id', SenseLink.linkTitleId(link))
            .attr('width', '100%').attr('height', '100%');
        // Added a div for the title
        titleObject.append('xhtml:div').attr('class', 'input-container')
            .text(this.options.labelGenerator ? this.newTitle() : 'click to change')
            .on('click', div => {
                this.clickLinkLabel(div);
            });
        // Remove the menu item 'Add title' to avoid multiply titles
        container.select('.btn-group .fa.fa-info').remove();
        // Move to the center of the link
        titleObject.attr('transform', this.getTitleTransform(titleObject.select('div'), link));
    }
    /**
     * Activate node title editing
     *
     * @param {Object} link
     */
    clickLinkLabel(link) {
        var input, titleId = '#' + SenseLink.linkTitleId(link),
            container = d3.select(titleId), div = container.select('div'),
            parent = d3.select(container.node().parentNode);
        d3.event.stopPropagation();
        link.id = SenseLink.linkId(link);
        // if the mode titleEditing is on the save the last input field
        if (this.titleEditing) {
            let oldInput = d3.selectAll('.sm-sensemap input');
            if (oldInput.node()) {
                if (oldInput.attr('data-id') == link.id) {
                    return;
                }
                this.endTitleEditing(oldInput, true);
            }
        }
        this.titleText = container.text();
        // Set the titleEditing mode on
        this.titleEditing = true;
        // Clean divLabel
        div.text('');
        // Add the input tag to the div divLabel
        input = div.append('xhtml:input').attr('type', 'text')
            .style('width', '60px')
            .attr('value', this.titleText).attr('data-id', link.id);
        input.node().autofocus = true;
        // Rearrange the input field
        container.attr('transform', this.getTitleTransform(div, link));
        // Hide the menu
        SenseLink.menu(false, parent.node(), link, false);
    }
}
