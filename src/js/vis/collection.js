/**
 * collection visualizes user browsing process.
 *
 * @param {SenseHistory} senseHistory
 */
sm.vis.collection = function(senseHistory) {
    // Private members
    var width = 400, height = 250,
        margin = {top: 5, right: 5, bottom: 5, left: 5},
        margins = {
            width: margin.left + margin.right,
            height: margin.top + margin.bottom
        },
        label = d => d.label,
        icon = d => d.icon,
        type = d => d.type,
        time = d => d.time, // Expect a Date object
        image = d => d.image,
        userImage = d => d.userImage,
        curated = false, // True to switch on selection for curation
        paused = false; // Suspend collecting

    var ZoomLevel = [
        {width: 26, imageWidth: 50, numChildren: 0},
        {width: 100, numChildren: 0},
        {width: 125, numChildren: 1},
        {width: 150, numChildren: 2}    // default zoom level
    ];
    ZoomLevel.forEach(z => {
        z.maxHeight = z.width / 0.75;
        if (z.imageWidth) {
            z.maxImageHeight = z.imageWidth / 0.75;
        }
    });

    // Rendering options
    var layout = sm.layout.forest(),
        panExtent = [0, 1, 0, 1],
        brushing = false,
        minZoomIndex = 0,
        maxZoomIndex = 3,
        defaultZoomIndex = maxZoomIndex,
        zoomLevelIndex = defaultZoomIndex,
        zoomLevel = ZoomLevel[zoomLevelIndex];

    // Data
    var data,
        dataNodes,
        dataLinks;

    // DOM
    var container, // g element containing the main, non-clipped visualization
        nodeContainer, // g element containing all nodes
        linkContainer; // g element containing all links

    // d3
    var line = d3.svg.line()
            .x(d => d.x)
            .y(d => d.y),
        brush = d3.svg.brush(),
        colorScale = d3.scale.category10()
            .domain(['search', 'location', 'dir', 'highlight', 'note', 'filter'])
            .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#e377c2']),
        searchTypes = ['search', 'location', 'dir'],
        iconClassLookup = {
            search: 'fa-search', location: 'fa-globe',
            dir: 'fa-street-view', highlight: 'fa-paint-brush',
            note: 'fa-file-text-o', filter: 'fa-filter'
        },
        dragging = 0, lastSelectedNode, dragSavedTitle,
        drag = d3.behavior.drag()
            .on('dragstart', onNodeDragStart)
            .on('drag', onNodeDrag)
            .on('dragend', onNodeDragEnd);

    // Key function to bind data
    var key = d => d.id,
        linkKey = d => key(d.source) + '-' + key(d.target);

    // Others
    var favorites = new SenseFavorite('#btnAddStarred', {
            firefoxSnapshot: senseHistory.options.firefoxSnapshot
        }, addStarred),
        pendingScrollId,
        dispatch = d3.dispatch('nodeClicked',
            'nodeCollectionRemoved', 'nodeCurationRemoved',
            'nodeFavorite', 'nodeUnfavorite',
            'nodeMinimized', 'nodeRestored',
            'nodeCollectionMoved', 'nodeCurationMoved', 'nodeHovered',
            'linkAdded', 'linkRemoved', 'curated'
        );
    /**
     * Main entry of the module.
     */
    function module(selection) {
        selection.each(function(_data) {
            data = _data;
            update(this);
        });
    }

    function update(self) {
        // Initialize
        if (!container) {
            container = d3.select(self).append('g')
                .attr('class', 'sm-sensemap')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            nodeContainer = container.append('g').attr('class', 'nodes');
            linkContainer = container.append('g').attr('class', 'links');
            brushContainer = container.append('g').attr('class', 'brush');

            sm.addPan([nodeContainer, linkContainer], container, panExtent);
            sm.createArrowHeadMarker(self, 'arrow-marker', '#6e6e6e');
            sm.createArrowHeadMarker(self, 'arrow-marker-hover', '#e74c3c');
            // addBrush();
        }

        dataNodes = (data.nodes || []).filter(n => !n.collectionRemoved);
        dataLinks = (data.links || []).filter(
            l => !l.userAdded && !l.source.collectionRemoved && !l.target.collectionRemoved
        );

        layout.width(width)
            .height(height)
            .label(label)
            .children(d => d.slaves ? d.slaves.filter(l => dataNodes.includes(l)) : d.slaves)
            .parent(d => d.leader && dataNodes.includes(d.leader) ? d.leader : null);

        brush.x(d3.scale.identity().domain([0, width]))
            .y(d3.scale.identity().domain([0, height]));

        var links = linkContainer.selectAll('.link').data(dataLinks, linkKey);
        links.enter().call(enterLinks);
        links.exit().remove();

        var nodes = nodeContainer.selectAll('.node-container').data(dataNodes, key);
        nodes.enter().call(enterNodes);
        nodes.call(updateNodes);
        nodes.exit().remove();

        // Layout DAG
        computeLayout(() => {
            nodes.call(updateNodePositions);
            links.call(updateLinks);
        });

        brushContainer.classed('hide', !curated);
    }

    function computeLayout(callback) {
        sm.checkImagesLoaded(container.selectAll('.node-container'), function() {
            // Compute how much space each node needs
            container.selectAll('.node').each(function(d) {
                var r = this.getBoundingClientRect();
                d.width = r.width + 1;
                d.height = r.height;
            });

            // DAG for nodes
            var g = layout.vertices(dataNodes).edges(dataLinks).compute();
            panExtent[1] = Math.max(0, g.width - width + margin.left + margin.right);
            panExtent[3] = Math.max(0, g.height - height + margin.top + margin.bottom);

            callback();
        });
    }

    /**
     * Does stuff when new nodes added (usually called when 'enter').
     */
    function enterNodes(selection) {
        var fo = selection.append('foreignObject')
                .attr('class', 'node-container')
                .attr('width', '100%').attr('height', '100%')
                .attr('opacity', 0);

        // Apply drag onto any 'foreignObject' on the view
        fo.call(drag);

        var container = fo.append('xhtml:div').attr('class', 'node')
            .attr('data-node', key)
            .on('click', nodeMouseClick);

        // To indicated if the node is curated
        container.append('xhtml:div').attr('class', 'node-curated fa fa-check-square hide');

        var parent = container.append('xhtml:div')
                .attr('class', 'parent')
                .attr('data-node', key)
                .call(sm.addBootstrapTooltip);

        // Icon
        var titleDiv = parent.append('xhtml:div').attr('class', 'node-title').attr('data-node', key);
        titleDiv.append('xhtml:div').attr('class', 'small-icon').append('xhtml:img').attr('class', 'node-icon');
        titleDiv.append('xhtml:div').attr('class', 'node-icon fa fa-fw');
        // Text
        titleDiv.append('xhtml:div').attr('class', 'node-label');
        // Snapshot
        parent.append('xhtml:img').attr('class', 'node-snapshot center-block');
        // Children
        var children = container.append('xhtml:div').attr('class', 'children')
            .attr('data-parent', d => d.id);
        children.append('xhtml:button')
            .attr('class', 'btn btn-default hide show-all-highlights')
            .attr('data-parent', d => d.id)
            .text('Show All')
            .on('click', highlightMouseClick);

        var menu = container.append('xhtml:div')
            .attr('data-node', d => d.id)
            .attr('class', 'btn-group hideMenu')
            .style('top', '-2px').on('click', d => {
                if (d3.event.defaultPrevented) {
                    return;
                }
                d3.event.stopPropagation();
                var chosenButton = d3.event.target.className.split(' ')[3],
                    menuContainer = d3.select(d3.event.target.parentNode).node().parentNode;
                nodeMenu.call(menuContainer, d, false);
                switch (chosenButton) {
                    case 'fa-star': favoriteOnOffClick.call(d3.event.target, d); break;
                    case 'fa-minus': minimizeClick.call(d3.event.target, d); break;
                    case 'fa-edit': curateClick.call(d3.event.target, d); break;
                    case 'fa-remove': removeClick.call(d3.event.target, d); break;
                    case 'fa-window-close-o': removeRestBranchClick.call(d3.event.target, d); break;
                    default: infoClick.call(d3.event.target, d); break;
                }
            });
        // Menu action
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-star')
            .attr('title', d => d.favorite ? 'Unfavorite' : 'Favorite');
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-minus')
            .attr('title', 'Minimize');
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-edit')
            .attr('title', 'Curate');
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
            .attr('title', 'Remove');
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-window-close-o')
            .attr('title', 'Cut rest of the branch');
        // Additional menu if the option 'debug' is turned on
        if (senseHistory.options.debugHistory) {
            menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-info')
                .attr('title', 'Info');
        }
    }

    /**
     * Does stuff when nodes updated (usually called when 'update').
     */
    function updateNodes(selection) {
        selection.each(function(d) {
            d3.select(this).select('.node').classed('mini', d.minimized)
                .attr('title', d.minimized ? 'Maximize' : '');
            d3.select(this).selectAll('.parent, .children').classed('hide', d.minimized);

            // Status
            d3.select(this).select('.node')
                .attr('in-queue', senseHistory.getNumberInQueue(d))
                .classed('not-seen', !d.seen)
                .classed('highlighted', isHighlighted(d))
                .classed('tab-closed', isTabClosed(d))
                .classed('many-tabs', isManyTabs(d))
                .classed('brushed', d.collectionBrushed && !d.curationRemoved);

            // Tooltip
            d3.select(this).select('.parent').attr('data-original-title', buildHTMLTitle(d));

            if (!d.minimized) {
                var typeVisible = searchTypes.includes(type(d)),
                    container = d3.select(this).select('.parent');
                container.select('img.node-icon').attr('src', icon)
                    .classed('hide', typeVisible || !icon(d));
                container.select('div.node-icon')
                    .classed('hide', !typeVisible)
                    .classed(iconClassLookup[type(d)], true)
                    .style('background-color', typedLabelBackground(d));

                // Show image only in min zoom
                var showImage = isImageVisible(d);
                if (zoomLevelIndex === minZoomIndex && showImage) {
                    container.selectAll('.node-icon').classed('hide', true);
                }
                container.select('.node-title').classed('hide', zoomLevelIndex === minZoomIndex && showImage);

                // Text
                container.select('.node-label').text(label)
                    .classed('min-zoom', zoomLevelIndex === minZoomIndex)
                    .classed('hide', zoomLevelIndex === minZoomIndex && icon(d));

                // Snapshot
                container.select('img.node-snapshot')
                    .attr('src', finalImage)
                    .classed('hide', !showImage);
                d3.select(this).select('.node').classed('favorite', d.favorite);

                if (d.children) {
                    updateChildren(d3.select(this).select('.children'), d);
                }
                container.classed('has-children', d.children && zoomLevel.numChildren);
                d3.select(this).select('.children').classed('hide', !d.children || !zoomLevel.numChildren);

                // Set here first to limit the size before running the layout.
                // Then set again in nodePositions when images loaded.
                scaleNode(this);
            } else {
                d3.select(this).select('.node').style('width', '8px');
            }
            if (isHighlighted(d) && !pendingScrollId) {
                pendingScrollId = setTimeout(() => {
                    scrollToHighlightedNode(this, d);
                }, 1250);
            }
        });
    }
    /**
     * Scroll the graph to the highlighted node using info from the container
     *
     * @param {Object} container
     * @param {SenseNode} node
     */
    function scrollToHighlightedNode(container, node) {
        var transform = d3.select(container).attr('transform'),
            newCoords = [0, 0];
        pendingScrollId = undefined;
        // Check if the node has non-empty transform attribute
        if (transform) {
            let g = layout.getDimension(),
                body = d3.select('body').node(),
                foreignCoords = transform.split(/\(|,|\)/);
            // Get coordinates of the node and cut off the fractional part
            foreignCoords = [parseInt(foreignCoords[1]), parseInt(foreignCoords[2])];
            // prepare data to work with the cycle 'for' below
            g.graph = [g.width, g.height]; g.body = [body.clientWidth, body.clientHeight];
            g.margins = [margin.left, margin.top];
            let calcPosition = {
                gd: [body.clientWidth - g.width, body.clientHeight - g.height],
                left: [foreignCoords[0] + margin.left, foreignCoords[1] + margin.top],
                right: [
                    foreignCoords[0] + parseInt(node.width) + margins.width,
                    foreignCoords[1] + parseInt(node.height) + margins.height
                ],
                delta: []
            };
            /**
             * Check X and Y coordinates and try to place a node in positions (Pxx) of the below visual matrix
             * +-------------+
             * | Prt Pmt Plt |
             * | Prm Pmm Plm |
             * | Prb Pmb Plb |
             * +-------------+
             */
            for (var i = 0; i <= 1; i++) {
                calcPosition.delta.push(g.body[i] - calcPosition.right[i] + 1);
                if (foreignCoords[i] && calcPosition.gd[i] < 0) {
                    // If the node has an extreme position on the left or up side
                    if (calcPosition.left[i] + g.body[i] < g.graph[i]) {
                        newCoords[i] = g.margins[i] - calcPosition.left[i];
                    } else if (calcPosition.delta[i] >= 0) {
                        // If the node has an extreme position on the right or botom side
                        newCoords[i] = calcPosition.gd[i];
                    } else {
                        newCoords[i] = g.body[i] - calcPosition.right[i];
                    }
                }
            }
        }
        // Set new coordinates
        nodeContainer.attr('transform', toTranslateStr(newCoords));
        linkContainer.attr('transform', toTranslateStr(newCoords));
        /**
         * Convert the matrix to the string 'translate(number, number)'
         *
         * @param {Array|Number} x
         * @param {Undefined|Number} [y]
         * @returns {String}
         */
        function toTranslateStr(x, y) {
            var result = 'translate(0, 0)';
            if (typeof x == 'number' && typeof y == 'number') {
                result = 'translate(' + x + ',' + y + ')';
            } else if (Array.isArray(x)) {
                result = 'translate(' + x.join(', ') + ')';
            }
            return result;
        }
    }

    function isHighlighted(d) {
        return d.highlighted || d.children && d.children.some(c => c.highlighted);
    }
    /**
     * Check if a node or its parent has the defined fields tabId and windowId
     *
     * @param {SenseNode|SenseHighlight} d
     * @returns {boolean}
     */
    function isTabClosed(d) {
        var result = false;
        if (d instanceof SenseNode) {
            result = typeof d.tabId == 'undefined' && typeof d.windowId == 'undefined';
        } else if (d instanceof SenseHighlight) {
            let node = d.keeper;
            result = typeof node.tabId == 'undefined' && typeof node.windowId == 'undefined';
        }
        return result;
    }
    /**
     * Check if a tab of the node is closed
     *
     * @param {SenseHighlight} d
     * @returns {Boolean}
     */
    function typedLabelBackground(d) {
        return colorScale(type(d));
    }
    /**
     * Check how many tabs are already opened for the node.
     * Note: It's only a program model of all the tabs.
     *
     * @param {SenseNode} d
     * @returns {Boolean}
     */
    function isManyTabs(d) {
        return senseHistory.tabs.count(d.url) > 1;
    }

    function isImageVisible(d) {
        return userImage(d) || image(d) && d.favorite;
    }

    function finalImage(d) {
        return userImage(d) || image(d);
    }

    function buildHTMLTitle(d) {
        var s = '';
        // Show image in tooltip if it's not shown in the box
        if (!isImageVisible(d) && finalImage(d)) {
            s += '<img class="node-snapshot img-responsive center-block" src="' + finalImage(d) + '"/>';
        }

        if (label(d)) {
            s += label(d);
        }

        return s;
    }

    /**
     * Scale image, text according to zoom level.
     */
    function scaleNode(self) {
        var d = d3.select(self).datum(),
            isMinZoomFavorite = zoomLevelIndex === minZoomIndex && isImageVisible(d);
        d3.select(self).select('.node').style('width', (isMinZoomFavorite ? zoomLevel.imageWidth : zoomLevel.width) + 'px');

        scaleText(self);
        scaleImage(self);
    }

    /**
     * Sets max-width for text to get text trimmed. Set for both the node and its children.
     */
    function scaleText(self) {
        d3.select(self).selectAll('.node-label')
            .each(function(d) {
                // Available width depends on size of icon
                var iconNode = this.parentNode.querySelector('.node-icon:not(.hide)'),
                    iconWidth = iconNode ? iconNode.getBoundingClientRect().width : 0;

                // There are two cases that width is equal to 0: a div or an img without src.
                // a div with non yet loaded css always has width of 20px.
                if (!iconWidth && iconNode && iconNode.tagName.toLowerCase() === 'div') {
                    iconWidth = 20;
                }

                // For any reason makes the icon's width 0, set it to the max 20
                if (icon(d) && !iconWidth) {
                    iconWidth = 20;
                }

                var marginPadding = iconWidth ? 12 : 6,
                    w = zoomLevel.width - iconWidth - marginPadding;
                d3.select(this).style('max-width', w + 'px');
            });
    }

    /**
     * Sets the height of image, depending on the zoom level.
     */
    function scaleImage(self) {
        var d = d3.select(self).datum(),
            isMinZoomFavorite = zoomLevelIndex === minZoomIndex && isImageVisible(d),
            childrenHeight = self.querySelector('.children').getBoundingClientRect().height,
            mainHeight = (isMinZoomFavorite ? zoomLevel.maxImageHeight : zoomLevel.maxHeight) - childrenHeight;
        d3.select(self).select('.parent').style('max-height', mainHeight + 'px');
    }

    function updateChildren(container, d) {
        // Enter
        var dataSubItems = d.collectionShowAll ? d.children : _.take(d.children, zoomLevel.numChildren),
            subItems = container.selectAll('.sub-node').data(dataSubItems, key),
            enterItems = subItems.enter().append('div').attr('class', 'sub-node')
                .attr('data-parent', d.id)
                .attr('data-highlight', h => h.id)
                .call(sm.addBootstrapTooltip)
                .on('click', d => {
                    if (d3.event.defaultPrevented || d3.event.shiftKey) {
                        return;
                    }
                    dispatch.nodeClicked(d);
                    d3.event.stopPropagation(); // Prevent click fired in parent
                }
            );

        // - Icon
        enterItems.append('xhtml:div').attr('class', 'node-icon fa fa-fw');

        // - Text
        enterItems.append('xhtml:div').attr('class', 'node-label');

        // Update
        subItems.attr('data-original-title', label)
            .each(function(d2) {
                d3.select(this).select('.node-icon')
                    .classed(iconClassLookup.note + ' ' + iconClassLookup.highlight, false)  // reset first
                    .classed(iconClassLookup[type(d2)], true)
                    .style('background-color', typedLabelBackground(d2));
            });
        subItems.select('.node-label').text(label)
            .style('max-width', (zoomLevel.width - 10) + 'px');

        // Exit
        subItems.exit().style('opacity', 0).remove();
    }

    /**
     * Separate from updateNodes() because updateNodes() needs to run first to get node sizes.
     */
    function updateNodePositions(selection) {
        selection.each(function(d) {
            d3.select(this).transition().duration(500)
                .attr('opacity', 1)
                .attr('transform', 'translate(' + roundPoint(d) + ')');

            // Curated indication
            var nc = d3.select(this).select('.node-curated')
                .classed('hide', !d.curated || d.curationRemoved)
                .style('top', d.minimized ? '-3px' : '-1px');
            var w = nc.node().getBoundingClientRect().width;
            nc.style('left', (d.minimized ? -2 : d.width - w - 1) + 'px');

            if (!d.minimized) {
                scaleNode(this);
            }
        });
    }
    /**
     * Update node's position from the d3.event while dragging
     *
     * @param {SenseNode} d
     */
    function updateDragPosition(d) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
    }
    /**
     * Start dragging mode
     *
     * @param {SenseNode} d
     */
    function onNodeDragStart(d) {
        if (d3.event.sourceEvent.which === 1 && !d3.event.sourceEvent.shiftKey) {
            let divNode = this.querySelector('.node .parent');
            $(divNode).tooltip('hide');
            divNode = d3.select(divNode);
            dragSavedTitle = divNode.attr('data-original-title');
            divNode.attr('data-original-title', null);
            dragging++;
        }
        d3.event.sourceEvent.preventDefault();
    }
    /**
     * Keep dragging mode
     *
     * @param {SenseNode} d
     */
    function onNodeDrag(d) {
        if (!dragging) {
            return;
        } else if (dragging > 3) {
            // Hide the node's menu
            nodeMenu.call(this, d, false);
        }
        dragging++;
        // Update the node's position
        this.moveToFront();
        updateDragPosition(d);
        let dims = [Math.round(d.x), Math.round(d.y)];
        d3.select(this).attr('transform', 'translate(' + roundPoint(d) + ')');
        // Highlight another node if the node is over on it.
        let overNode = dataNodes.find(node => {
            var nodeX1 = node.x + node.width, nodeY1 = node.y + node.height;
            return d.id != node.id
                && dims[0] >= node.x && dims[0] <= nodeX1
                && dims[1] >= node.y && dims[1] <= nodeY1;
        });
        if (overNode) {
            lastSelectedNode = overNode;
            setBrushed(lastSelectedNode.id, true);
        } else if (lastSelectedNode) {
            setBrushed(lastSelectedNode.id, false);
            lastSelectedNode = undefined;
        }
        d3.event.sourceEvent.preventDefault();
    }
    /**
     * End dragging mode
     *
     * @param {SenseNode} d
     */
    function onNodeDragEnd(d) {
        if (dragging) {
            let divNode = d3.select(this.querySelector('.node .parent'));
            if (lastSelectedNode) {
                d.leader = lastSelectedNode;
                setBrushed(lastSelectedNode.id, false);
                lastSelectedNode = undefined;
            }
            divNode.attr('data-original-title', dragSavedTitle);
            dragging = 0;
            senseHistory.dispatch.dataChanged('update');
        }
        d3.event.sourceEvent.preventDefault();
    }
    /**
     * Does stuff when new links added (usually called when 'enter').
     */
    function enterLinks(selection) {
        var container = selection.append('g').attr('class', 'link')
            .attr('opacity', 0);

        container.append('path').attr('class', 'main-link').on('mouseover', () => {
            d3.select(d3.event.target).classed('hovered', true);
            d3.event.preventDefault();
        }).on('mouseout', () => {
            d3.select(d3.event.target).classed('hovered', false);
            d3.event.preventDefault();
        }).on('click', d => {
            if (d3.event.defaultPrevented) {
                return;
            }
            d3.event.stopPropagation();
            d.target.leader = undefined;
            senseHistory.dispatch.dataChanged('update');
        });
    }
    /**
     * Does stuff when link updated (usually called when 'update').
     */
    function updateLinks(selection) {
        selection.each(function(d) {
            d3.select(this).transition().duration(500).attr('opacity', 1);
            if (d.points) {
                d3.select(this).select('path').transition().duration(500).attr('d', line(roundPoints(d)));
            }
            // A straight line goes through minimized node
            var isThrough = d.target.minimized && d.target.slaves && d.target.slaves.some(l => !l.collectionRemoved);
            d3.select(this).select('path').classed('straight-arrow', isThrough);
        });
    }

    /**
     * To make the line sharp.
     */
    function roundPoints(d) {
        // stroke-width: 1.5px
        return d.points.map(p => ({
            x: Math.round(p.x) - 0.5,
            y: Math.round(p.y) - 0.5
        }));
    }

    function roundPoint(d) {
        return [Math.round(d.x), Math.round(d.y)];
    }
    /**
     * Node handler of the event 'click'
     *
     * @param {Object} d
     */
    function nodeMouseClick(d) {
        if (d3.event.defaultPrevented || d3.event.shiftKey) {
            return;
        }
        d3.event.stopPropagation();

        if (d.minimized) {
            d.minimized = false;
            update(d);
            dispatch.nodeRestored(d);
        } else {
            dispatch.nodeClicked(d);
        }
    }
    /**
     * Node handler of the event 'mouseover'
     *
     * @param {Object} d
     */
    function nodeMouseOver(d) {
        // Hide tooltip
        if (brushing) {
            $(this.querySelector('.parent')).tooltip('hide');
            d3.select(this).selectAll('.sub-node').each(function() {
                $(this).tooltip('hide');
            });
        } else if (d.curated) {
            dispatch.nodeHovered(d, true);
        }
        nodeMenu.call(this, d, true);
    }
    /**
     * Node handler of the event 'mouseout'
     *
     * @param {Object} d
     */
    function nodeMouseOut(d) {
        if (d.curated) {
            dispatch.nodeHovered(d, false);
        }
        nodeMenu.call(this, d, false);
    }
    /**
     * Show or hide any node's menu
     *
     * @param {SenseNode} d
     * @param {Boolean} visible
     */
    function nodeMenu(d, visible) {
        var menu = d3.select(this).select('.btn-group');
        if (!menu) {
            return;
        }
        if (visible) {
            // Align menu to the right side
            menu.classed('hideMenu', brushing || d.minimized || dragging);
            let menuRect = menu.node().getBoundingClientRect(),
                nodeRect = this.getBoundingClientRect(),
                leftStyle = nodeRect.right > width - menuRect.width ? 1 - menuRect.width : d.width - 2;
            menu.style('left', leftStyle + 'px');
        } else {
            menu.classed('hideMenu', true);
        }
    }
    /**
     * Menu handler of the buttons 'Favorite' and 'Unfavorite'
     *
     * @param {SenseNode} node
     */
    function favoriteOnOffClick(node) {
        var context = this;
        if (node.seen) {
            favoriteProcess();
        } else {
            // Try to get a tab which is consist the node 'd'
            chrome.tabs.query({}, tabs => {
                var tab = tabs.find(t => t.url === node.url);
                if (tab) {
                    senseHistory.clickNodeExistedTab(node, tab, () => {
                        favoriteProcess();
                    });
                } else {
                    // If the tab is not found then create it but not favorite this one because
                    // now it is not possible to catch an end of loading content and set it as favorite
                    chrome.tabs.create({url: node.url}, tab => {
                        node.windowId = tab.windowId; node.tabId = tab.id;
                        chrome.windows.update(tab.windowId, {focused: true});
                        senseHistory.tasks.add(node.url, () => { favoriteProcess(); });
                    });
                }
            });
        }
        /**
         * Do favorite process to the node
         */
        function favoriteProcess() {
            // Use SenseFavorite to change the favorite status and update a package of the nodes
            favorites.process(node, () => {
                // Change the node's button
                d3.select(context).attr('title', favorites.btnTitle(node)).style('color', favorites.btnColor(node));
                update(node);
                dispatch[node.favorite ? 'nodeFavorite' : 'nodeUnfavorite'](node);
            });
        }
    }
    /**
     * Menu handler of the button 'Minimize'
     *
     * @param {Object} d
     */
    function minimizeClick(d) {
        d.minimized = true;
        update(d);
        dispatch.nodeMinimized(d);
    }
    /**
     * Menu handler of the button 'Curate'
     * isEvent - argument which is used in group adding of nodes to the Knowledge Map
     *
     * @param {Object} d
     */
    function curateClick(d) {
        if (d.curationRemoved || !d.curated) {
            linkContainer.selectAll('.link').each(function(l) {
                // Curate the link if the other end is also curated
                // Make sure if this link was removed, it reappears
                if (l.source === d && l.target.curated || l.target === d && l.source.curated) {
                    l.removed = false;
                }
            });
            d.curationRemoved = false; // Make sure if this node was removed, it reappears
            d.newlyCurated = true; // Force it run the layout to find its location
            update(d);
        }
        dispatch.curated(d);
    }
    /**
     * Menu handler of the button 'Remove'
     *
     * @param {SenseNode} d
     */
    function removeClick(d) {
        d3.select(this.parentNode.parentNode).classed('hovered', false);
        senseHistory.removeNode(d).forEach(slave => {
            update(slave);
        });
        update(d);
        // Lookup all the tabs with this.url and close them
        d.closeAllTabs();
        dispatch.nodeCollectionRemoved(d);
        senseHistory.dispatch.dataChanged('update');
    }
    /**
     * Remove the rest of the branch of all the nodes by a click
     *
     * @param {Object} d
     */
    function removeRestBranchClick(d) {
        d3.select(this.parentNode.parentNode).classed('hovered', false);
        removeSlaves(d);
        senseHistory.dispatch.dataChanged('update');
        /**
         * Remove all the slaves using this recursion
         *
         * @param {SenseNode} node
         */
        function removeSlaves(node) {
            if (node.slaves.length > 0) {
                node.slaves.forEach(n => { removeSlaves(n); });
            }
            node.leader = null;
            node.collectionRemoved = true;
            node.closeAllTabs();
            dispatch.nodeCollectionRemoved(node);
        }
    }
    /**
     * Menu handler of the button 'Info'
     *
     * @param {SenseNode} node
     */
    function infoClick(node) {
        console.log(node);
    }
    /**
     * Highlight handler of the event 'mouseover'
     *
     * @param {Object} d
     */
    function highlightMouseOver(d) {
        // Align menu to the right side
        var menu = d3.select(this).select('.show-all-highlights')
                .classed('hide', d.children && zoomLevel.numChildren >= d.children.length),
            menuRect = menu.node().getBoundingClientRect(),
            nodeRect = this.getBoundingClientRect();
        menu.style('left', (nodeRect.right > width - menuRect.width ? 1 - menuRect.width : d.width - 1) + 'px');
    }
    /**
     * Highlight handler of the event 'mouseout'
     */
    function highlightMouseOut() {
        d3.select(this).select('.show-all-highlights').classed('hide', true);
    }
    /**
     * Highlight handler of the event 'mouseout'
     *
     * @param {Object} d
     */
    function highlightMouseClick(d) {
        if (d3.event.defaultPrevented) {
            return;
        }
        d3.event.stopPropagation();
        d3.select(this).classed('hide', true);
        d.collectionShowAll = !d.collectionShowAll;
        d3.select(this).text(d.collectionShowAll ? 'Show Less' : 'Show All');
        update(d);
    }
    // Export the functions
    module.setBrushed = setBrushed;
    /**
     * Sets/gets the width of the control.
     */
    module.width = function(value) {
        if (arguments.length) {
            width = value;
            return this;
        } else {
            return width;
        }
    };

    /**
     * Sets/gets the height of the control.
     */
    module.height = function(value) {
        if (arguments.length) {
            height = value;
            return this;
        } else {
            return height;
        }
    };

    /**
     * Sets/gets the key function to bind data.
     */
    module.key = function(value) {
        if (arguments.length) {
            key = value;
            return this;
        } else {
            return key;
        }
    };

    /**
     * Sets/gets the label accessor.
     */
    module.label = function(value) {
        if (arguments.length) {
            label = value;
            return this;
        } else {
            return label;
        }
    };

    /**
     * Sets/gets the icon accessor.
     */
    module.icon = function(value) {
        if (arguments.length) {
            icon = value;
            return this;
        } else {
            return icon;
        }
    };

    /**
     * Sets/gets the curated status.
     */
    module.curated = function(value) {
        if (arguments.length) {
            curated = value;
            brushContainer.classed('hide', !curated);
            return this;
        } else {
            return curated;
        }
    };

    /**
     * Increases zoom level.
     */
    module.zoomIn = function() {
        zoomLevelIndex = Math.min(maxZoomIndex, zoomLevelIndex + 1);
        zoomLevel = ZoomLevel[zoomLevelIndex];
    };

    /**
     * Reduces zoom level.
     */
    module.zoomOut = function() {
        zoomLevelIndex = Math.max(minZoomIndex, zoomLevelIndex - 1);
        zoomLevel = ZoomLevel[zoomLevelIndex];
    };

    /**
     * Resets to the default zoom level.
     */
    module.resetZoom = function() {
        zoomLevelIndex = defaultZoomIndex,
        zoomLevel = ZoomLevel[zoomLevelIndex];
    };

    /**
     * Computes the zoom level based on a series of zooms
     */
    module.computeZoomLevel = function(zooms) {
        zoomLevelIndex = defaultZoomIndex;
        zooms.forEach(z => {
            if (z.type === 'collection-zoom-in') {
                zoomLevelIndex = Math.min(maxZoomIndex, zoomLevelIndex + 1);
            }
            if (z.type === 'collection-zoom-out') {
                zoomLevelIndex = Math.max(minZoomIndex, zoomLevelIndex - 1);
            }
        });
        zoomLevel = ZoomLevel[zoomLevelIndex];
    };

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    /**
     * Get the data-node attribute and call a node handler for the mouse events 'mouseover' and 'mouseout'
     *
     * @param {String} type
     * @param {Object} node
     */
    module.doMouseNode = function(type, node) {
        var id = node.getAttribute('data-node'),
            dataNode = dataNodes.find(el => el.id == id);
        if (!dataNode || dragging) {
            return;
        }
        // Search the parent 'node-container'
        if (node.classList.contains('btn-group')) {
            node = node.parentNode;
        } else if (!node.classList.contains('node-container')) {
            node = node.parentNode;
            if (!node.classList.contains('node-container')) {
                node = node.parentNode;
            } else {
                return;
            }
        }
        // Call the appropriate method
        if (type == 'mouseover') {
            nodeMouseOver.call(node, dataNode);
        } else {
            nodeMouseOut.call(node, dataNode);
        }
    };

    /**
     * Get the data-highlight attribute and call a highlight handler for the mouse events 'mouseover' and 'mouseout'
     *
     * @param {String} type
     * @param {Object} node
     */
    module.doMouseHighlight = function(type, node) {
        var id = node.getAttribute('data-parent'),
            dataParent = dataNodes.find(el => el.id == id);
        if (!dataParent) {
            return;
        }
        if (node.classList.contains('btn') || node.classList.contains('sub-node')) {
            node = node.parentNode;
        }
        // Call the appropriate method
        if (type == 'mouseover') {
            highlightMouseOver.call(node, dataParent);
        } else {
            highlightMouseOut.call(node, dataParent);
        }
    };

    return module;
    /**
     * Add all the favorites nodes to the Knowledge Map using the function setTimeout()
     */
    function addStarred() {
        var startNumber = 0, i;
        d3.event.stopPropagation();
        if (favorites.isReady()) {
            // Check if The Knowledge Map is not launched
            if (!senseHistory.options.curationWindowId) {
                curateClick(favorites.nodes[0]);
                startNumber++;
            }
            // Launch sequential adding all the nodes every one second
            for (i = startNumber; i < favorites.nodes.length; i++) {
                let number = i;
                setTimeout(() => {
                    curateClick(favorites.nodes[number]);
                }, 1000 * i);
            }
        }
        toggleToolbar();
    }

    function toggleToolbar() {
        d3.select('.btn-toolbar').classed('hide', !d3.select('.btn-toolbar').classed('hide'));
    }
    /**
     * Sets brushing status of the given node
     *
     * @param {Number} id
     * @param {Boolean} value
     */
    function setBrushed(id, value) {
        nodeContainer.selectAll('.node').each(function(d) {
            d.collectionBrushed = value && key(d) === id && !d.curationRemoved;
            d3.select(this).classed('brushed', d.collectionBrushed);
        });
    }
    // function addBrush() {
    //     brush.x(d3.scale.identity().domain([0, width]))
    //         .y(d3.scale.identity().domain([0, height]))
    //     .on('brushstart', function () {
    //         brushing = true;
    //     }).on('brush', function () {
    //         // Brush nodes and links
    //         var brushNode = brushContainer.select('.extent').node();
    //         nodeContainer.selectAll('.node').each(function(d) {
    //             d.brushed = this.intersect(brushNode);
    //             d3.select(this).classed('brushed', d.brushed);
    //         });

    //         linkContainer.selectAll('.link').each(function(l) {
    //             l.brushed = l.source.brushed && l.target.brushed;
    //             d3.select(this).select('path').classed('brushed', l.brushed);
    //         });
    //     }).on('brushend', function () {
    //         brushing = false;
    //         var changed = false;

    //         // Remove brush effect
    //         nodeContainer.selectAll('.node').each(function(d) {
    //             if (d.brushed && !d.curated) {
    //                 changed = d.curated = true;
    //                 d.curationRemoved = false; // Make sure if this node was removed, it reappears
    //             }
    //             d3.select(this).classed('brushed', false);
    //         });

    //         linkContainer.selectAll('.link').each(function(l) {
    //             if (l.brushed) {
    //                 l.removed = false; // Make sure if this link was removed, it reappears
    //                 changed = true;
    //             }
    //             d3.select(this).select('path').classed('brushed', false);
    //         });

    //         brushContainer.call(brush.clear());

    //         update();

    //         if (changed) dispatch.curationChanged();
    //     });

    //     brushContainer.call(brush);
    // }
};
