/**
 * curation allows curate data collection.
 */
sm.vis.curation = function() {
    // Private members
    var width = 400, height = 250,
        margin = { top: 5, right: 5, bottom: 5, left: 5 },
        label = d => d.label,
        children = d => d.rlinks,
        icon = d => d.icon,
        type = d => d.type,
        time = d => d.time, // Expect a Date object
        image = d => d.image;

    var ZoomLevel = [
        { width: 26, imageWidth: 50, numChildren: 0 },
        { width: 100, numChildren: 0 },
        { width: 125, numChildren: 1 },
        { width: 150, numChildren: 2 }
    ];
    ZoomLevel.forEach(z => {
        z.maxHeight = z.width / 0.75;
    });

    // Rendering options
    var layout = sm.layout.grid(),
        panExtent = [ 0, 1, 0, 1 ],
        defaultMaxWidth = 150,
        dragging = false,
        connecting = false,
        minZoomIndex = 0,
        maxZoomIndex = 3,
        zoomLevelIndex = maxZoomIndex,
        zoomLevel = ZoomLevel[zoomLevelIndex],
        connectingTimerId;

    // Data
    var data,
        dataNodes,
        dataLinks;

    // DOM
    var container, // g element containing the main, non-clipped visualization
        nodeContainer, // g element containing all nodes
        linkContainer, // g element containing all links
        cursorLink; // to draw a link when moving mouse

    // d3
    var line = d3.svg.line()
            .x(d => d.x)
            .y(d => d.y),
        colorScale = d3.scale.category10()
            .domain([ 'search', 'location', 'dir', 'highlight', 'note', 'filter' ])
            .range([ '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#e377c2' ]),
        searchTypes = [ 'search', 'location', 'dir' ],
        iconClassLookup = { search: 'fa-search', location: 'fa-globe', dir: 'fa-street-view', highlight: 'fa-paint-brush',
            note: 'fa-file-text-o', filter: 'fa-filter'
        };
    var drag = d3.behavior.drag()
        .on('dragstart', onNodeDragStart)
        .on('drag', onNodeDrag)
        .on('dragend', onNodeDragEnd);

    // Key function to bind data
    var key = d => d.id,
        linkKey = d => key(d.source) + '-' + key(d.target),
        linkHoverKey = d => key(d.source) + '-' + key(d.target) + 'h';

    // Others
    var dispatch = d3.dispatch('nodeClicked', 'nodeCollectionRemoved', 'nodeCurationRemoved', 'nodeFavorite', 'nodeUnfavorite',
        'nodeMinimized', 'nodeRestored', 'nodeMoved', 'nodeHovered', 'linkAdded', 'linkRemoved');

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
            cursorLink = container.append('line').attr('class', 'cursor-link hide');

            sm.addPan([ nodeContainer, linkContainer, cursorLink ], container, panExtent);
            sm.createArrowHeadMarker(self, 'arrow-marker', '#6e6e6e');
            sm.createArrowHeadMarker(self, 'arrow-marker-hover', '#e74c3c');
            sm.createArrowHeadMarker(self, 'arrow-marker-cursor', 'blue');
        }

        dataNodes = (data.nodes || []).filter(n => n.curated && !n.curationRemoved);
        dataLinks = (data.links || []).filter(l => dataNodes.includes(l.source) && dataNodes.includes(l.target) && !l.removed);

        // Curated nodes may have smaller set of children than the corresponding in collection
        dataNodes.filter(n => n.links).forEach(n => {
            n.rlinks = n.links.filter(target => dataNodes.includes(target));
        });

        layout.width(width)
            .height(height)
            .label(label)
            .children(children);

        var links = linkContainer.selectAll('.link').data(dataLinks, linkKey);
        links.enter().call(enterLinks);
        links.exit().remove();

        var nodes = nodeContainer.selectAll('.node-container').data(dataNodes, key);
        nodes.enter().call(enterNodes);
        nodes.call(updateNodes);
        nodes.exit().remove();

        // Layout DAG
        computeLayout(function() {
            links.call(updateLinks);
            nodes.call(updateNodePositions);
        });

        // Press escape to exit connecting mode
        document.addEventListener("keydown", function(e) {
            if (e.keyCode === 27) {
                connecting = false;
                dragging = false;
                nodeContainer.selectAll('.node').each(function() {
                    d3.select(this).classed('connect', false);
                });
                cursorLink.classed('hide', true);
            }
        });
    }

    function computeLayout(callback) {
        sm.checkImagesLoaded(container.selectAll('.node-container'), function() {
            // Compute how much space each node needs
            container.selectAll('.node').each(function(d) {
                var r = this.getBoundingClientRect();
                d.rp = d.rp || {};
                d.rp.width = r.width + 1;
                d.rp.height = r.height;
            });

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

        // Apply drag onto the 'foreignObject'
        fo.call(drag);

        var container = fo.append('xhtml:div').attr('class', 'node')
            .on('click', function(d) {
                if (d3.event.defaultPrevented || d3.event.shiftKey) return;
                clearTimeout(connectingTimerId);
                dispatch.nodeClicked(d);
            }).on('mouseover', function(d) {
                // Align menu to the right side
                var menu = d3.select(this).select('.btn-group').classed('hide', dragging),
                    menuRect = menu.node().getBoundingClientRect(),
                    nodeRect = this.getBoundingClientRect();
                menu.style('left', (nodeRect.right > width - menuRect.width ? 1 - menuRect.width : d.rp.width - 1) + 'px');

                if (dragging) {
                    hideTooltip(this);
                } else {
                    dispatch.nodeHovered(d, true);
                }
            }).on('mouseout', function(d) {
                container.classed('connect', false);
                hideMenu(this);
                dispatch.nodeHovered(d, false)
            });

        var menu = container.append('xhtml:div').attr('class', 'btn-group hide').style('top', '-2px');
        var parent = container.append('xhtml:div').attr('class', 'parent')
            .call(sm.addBootstrapTooltip);

        // Icon
        var titleDiv = parent.append('xhtml:div').attr('class', 'node-title');
        titleDiv.append('xhtml:img').attr('class', 'node-icon');
        titleDiv.append('xhtml:div').attr('class', 'node-icon fa fa-fw');

        // Text
        titleDiv.append('xhtml:div').attr('class', 'node-label');

        // Snapshot
        parent.append('xhtml:img').attr('class', 'node-snapshot center-block');

        // Menu action
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
            .attr('title', 'Remove')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed('hide', true);
                d.curationRemoved = true;
                d.curated = d.brushed = false;
                connecting = false;
                clearTimeout(connectingTimerId);

                // Remove connected links
                dataLinks.filter(l => l.source === d || l.target === d).forEach(l => { l.removed = true; });

                update();
                dispatch.nodeCurationRemoved(d);
            });

        // Children
        container.append('xhtml:div').attr('class', 'children');
    }

    function hideMenu(self) {
        d3.select(self).select('.btn-group').classed('hide', true);
    }

    function hideTooltip(self) {
        $(d3.select(self).select('.parent').node()).tooltip('hide');
        d3.select(self).selectAll('.sub-node').each(function() {
            $(this).tooltip('hide');
        });
    }

    /**
     * Does stuff when nodes updated (usually called when 'update').
     */
    function updateNodes(selection) {
        selection.each(function(d) {
            // Status
            d3.select(this).select('.node')
                .classed('not-seen', !d.seen)
                .classed('highlighted', isHighlighted(d));

            // Tooltip
            d3.select(this).select('.parent').attr('data-original-title', label);

            var typeVisible = searchTypes.includes(type(d)),
                container = d3.select(this).select('.parent');
            container.select('img.node-icon').attr('src', icon)
                .classed('hide', typeVisible || !icon(d));
            container.select('div.node-icon')
                .classed('hide', !typeVisible)
                .classed(iconClassLookup[type(d)], true)
                .style('background-color', colorScale(type(d)));

            // Show image only in min zoom
            if (zoomLevelIndex === minZoomIndex && image(d)) {
                container.selectAll('.node-icon').classed('hide', true);
            }
            container.select('.node-title').classed('hide', zoomLevelIndex === minZoomIndex && image(d));

            // Text
            container.select('.node-label').text(label)
                .classed('min-zoom', zoomLevelIndex === minZoomIndex)
                .classed('hide', zoomLevelIndex === minZoomIndex && icon(d));

            // Snapshot
            container.select('img.node-snapshot')
                .attr('src', image)
                .classed('hide', !image(d));

            if (d.children) updateChildren(d3.select(this).select('.children'), d);
            container.classed('has-children', d.children && zoomLevel.numChildren);
            d3.select(this).select('.children').classed('hide', !d.children || !zoomLevel.numChildren);

            // Set here first to limit the size before running the layout.
            // Then set again in nodePositions when images loaded.
            scaleNode(this);
        });
    }

    function isHighlighted(d) {
        return d.highlighted || d.children && d.children.some(c => c.highlighted);
    }

    /**
     * Scale image, text according to zoom level.
     */
    function scaleNode(self) {
        var d = d3.select(self).datum(),
            isMinZoomFavorite = zoomLevelIndex === minZoomIndex && image(d);
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
                var icon = this.parentNode.querySelector('.node-icon:not(.hide)'),
                    iconWidth = icon ? icon.getBoundingClientRect().width : 0;

                // There are two cases that width is equal to 0: a div or an img without src.
                // a div with non yet loaded css always has width of 20px.
                if (!iconWidth && icon && icon.tagName.toLowerCase() === 'div') iconWidth = 20;

                // For any reason makes the icon's width 0, set it to the max 20
                if (image(d) && !iconWidth) iconWidth = 20;

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
            isMinZoomFavorite = zoomLevelIndex === minZoomIndex && image(d),
            childrenHeight = self.querySelector('.children').getBoundingClientRect().height,
            mainHeight = (isMinZoomFavorite ? zoomLevel.maxImageHeight : zoomLevel.maxHeight) - childrenHeight;
        d3.select(self).select('.parent').style('max-height', mainHeight + 'px');
    }

    function updateChildren(container, d) {
        // Enter
        var subItems = container.selectAll('.sub-node').data(d.collectionShowAll ? d.children : _.take(d.children, zoomLevel.numChildren), key);
        var enterItems = subItems.enter().append('div').attr('class', 'sub-node')
            .call(sm.addBootstrapTooltip)
            .on('click', function(d) {
                if (d3.event.defaultPrevented || d3.event.shiftKey) return;
                dispatch.nodeClicked(d);
                clearTimeout(connectingTimerId);
                d3.event.stopPropagation(); // Prevent click fired in parent
            });

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
                    .style('background-color', colorScale(type(d2)));
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
        });
    }

    /**
     * Does stuff when new links added (usually called when 'enter').
     */
    function enterLinks(selection) {
        var container = selection.append('g').attr('class', 'link')
            .attr('opacity', 0);

        // Main link
        container.append('path')
            .attr('id', linkKey)
            .attr('class', 'main-link')
            .classed('user-added', d => d.userAdded);

        // Dummy link for easy selection
        container.append('path')
            .attr('id', linkHoverKey)
            .attr('class', 'hover-link');

        container.on('mouseover', function(d) {
            showLinkMenu(true, this);
        }).on('mouseout', function(d) {
            showLinkMenu(false, this);
        });

        // Menu action
        var menu = container.append('foreignObject')
            .attr('class', 'menu-container')
            .attr('width', '100%').attr('height', '100%')
            .append('xhtml:div').attr('class', 'btn-group hide');

        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
            .attr('title', 'Remove')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed('hide', true);
                d.removed = true;
                update();
                dispatch.linkRemoved(d);
            });

        container.append('title');
    }

    function showLinkMenu(visible, self) {
        // Link feedback
        d3.select(self).select('.main-link').classed('hovered', visible);

        var d = d3.select(self).datum();
        d3.select(self).select('.btn-group').classed('hide', !visible || dragging);

        // Menu: show it at the middle of the link : sometimes, menu disappear along the way
        var m = d.rpoints.length / 2,
            w = d3.select(self).select('.btn-group').node().getBoundingClientRect().width / 2,
            t = [ d.rpoints.length % 2 ? d.rpoints[m - 0.5].x : (d.rpoints[m].x + d.rpoints[m - 1].x) / 2 - w,
                d.rpoints.length % 2 ? d.rpoints[m - 0.5]. cy : (d.rpoints[m].y + d.rpoints[m - 1].y) / 2 - w ];

        d3.select(self).select('.menu-container').attr('transform', 'translate(' + t + ')');
    }

    /**
     * Does stuff when link updated (usually called when 'update').
     */
    function updateLinks(selection) {
        selection.each(function(d) {
            var container = d3.select(this);

            container.transition().duration(500).attr('opacity', 1);

            // Set data
            container.selectAll('path').transition().duration(500).attr('d', line(roundPoints(d)));
        });
    }

    /**
     * To make the line sharp.
     */
    function roundPoints(l) {
        // stroke-width: 1.5px
        var centerSource = { x: l.source.rp.x + l.source.rp.width / 2, y: l.source.rp.y + l.source.rp.height / 2 },
            centerTarget = { x: l.target.rp.x + l.target.rp.width / 2, y: l.target.rp.y + l.target.rp.height / 2 };

        l.rpoints = [ sm.getRectEdgePoint(l.source.rp, centerTarget), sm.getRectEdgePoint(l.target.rp, centerSource) ];

        return l.rpoints.map(p => ({ x: Math.round(p.x) - 0.5, y: Math.round(p.y) - 0.5 }));
    }

    function roundPoint(d) {
        return [ Math.round(d.rp.x), Math.round(d.rp.y) ];
    }

    function updateDragPosition(d) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
    }

    function updateLinkDragPosition(d) {
        d3.select(document.getElementById(linkKey(d))).attr('d', line(roundPoints(d)));
        d3.select(document.getElementById(linkHoverKey(d))).attr('d', line(roundPoints(d)));
    }

    function onNodeDragStart(d) {
        if (d3.event.sourceEvent.which === 1 && !d3.event.sourceEvent.shiftKey) {
            var self = this;
            connectingTimerId = setTimeout(function() {
                connecting = true;
                d3.select(self.querySelector('.node')).classed('connect', true);
                hideMenu(self.querySelector('.node'));
            }, 300);
            dragging = true;
            d3.event.sourceEvent.stopPropagation();
        }

        // Bootstrap tooltip appears even when moving the node => disable it
        hideTooltip(this);
    }

    function onNodeDrag(d) {
        if (!dragging) return;

        // Already drag, no need to check
        clearTimeout(connectingTimerId);
        d3.select(this.querySelector('.node')).classed('connect', false);

        hideMenu(this.querySelector('.node'));

        if (connecting) {
            // Draw a link from the node center to the current mouse position
            cursorLink.classed('hide', false);
            cursorLink
                .attr('x1', d.rp.x + d.rp.width / 2).attr('y1', d.rp.y + d.rp.height / 2)
                .attr('x2', d3.event.x).attr('y2', d3.event.y);

            // Don't know why mouse over other nodes doesn't work. Have to do it manually
            var self = this;
            nodeContainer.selectAll('.node').each(function() {
                d3.select(this).classed('hovered', this.parentNode !== self && this.containsPoint(d3.event.sourceEvent));
            });
        } else {
            this.moveToFront();

            // Update position of the dragging node
            updateDragPosition(d.rp);
            d3.select(this).attr('transform', 'translate(' + roundPoint(d) + ')');

            // And also links
            dataLinks.filter(l => l.source === d || l.target === d).forEach(updateLinkDragPosition);
        }
    }

    function onNodeDragEnd(d) {
        cursorLink.classed('hide', true);

        if (connecting) {
            var self = this,
                found = false;
            nodeContainer.selectAll('.node').each(function(d2) {
                d3.select(this).classed('hovered', false);

                if (!found && this.parentNode !== self && this.containsPoint(d3.event.sourceEvent)) {
                    // Add a link from the dragging node to the hovering node if not existed
                    var l = data.links.find(l => l.source === d && l.target === d2);
                    if (!l) {
                        var l = { source: d, target: d2, userAdded: true };
                        data.links.push(l);
                    } else {
                        l.removed = false;
                    }

                    // Find position of two end-points
                    var centerSource = { x: l.source.rp.x + l.source.rp.width / 2, y: l.source.rp.y + l.source.rp.height / 2 },
                        centerTarget = { x: l.target.rp.x + l.target.rp.width / 2, y: l.target.rp.y + l.target.rp.height / 2 };
                    l.rpoints = [ sm.getRectEdgePoint(l.source.rp, centerTarget), sm.getRectEdgePoint(l.target.rp, centerSource) ];

                    found = true;
                    update();
                    dispatch.linkAdded(l);
                }
            });
        } else {
            dispatch.nodeMoved(d);
        }

        dragging = connecting = false;
    }

    /**
     * Sets/gets the width of the control.
     */
    module.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return this;
    };

    /**
     * Sets/gets the height of the control.
     */
    module.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return this;
    };

    /**
     * Sets/gets the key function to bind data.
     */
    module.key = function(value) {
        if (!arguments.length) return key;
        key = value;
        return this;
    };

    /**
     * Sets/gets the label accessor.
     */
    module.label = function(value) {
        if (!arguments.length) return label;
        label = value;
        return this;
    };

    /**
     * Sets/gets the icon accessor.
     */
    module.icon = function(value) {
        if (!arguments.length) return icon;
        icon = value;
        return this;
    };

    /**
     * Sets brushing status of the given node.
     */
    module.setBrushed = function(id, value) {
        nodeContainer.selectAll('.node').each(function(d) {
            d3.select(this).classed('brushed', value && key(d) === id);
        });
    };

    /**
     * Increase zoom level.
     */
    module.zoomIn = function() {
        zoomLevelIndex = Math.min(maxZoomIndex, zoomLevelIndex + 1);
        zoomLevel = ZoomLevel[zoomLevelIndex];
    };

    /**
     * Reduce zoom level.
     */
    module.zoomOut = function() {
        zoomLevelIndex = Math.max(minZoomIndex, zoomLevelIndex - 1);
        zoomLevel = ZoomLevel[zoomLevelIndex];
    };

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};