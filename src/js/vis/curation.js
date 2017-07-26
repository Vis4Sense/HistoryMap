/**
 * curation allows curate data collection.
 *
 * @param {SenseKnowledge} senseKnowledge
 */
sm.vis.curation = function(senseKnowledge) {
    // Private members
    var width = 400, height = 250,
        margin = {top: 5, right: 5, bottom: 5, left: 5},
        label = d => d.label,
        children = d => d.rlinks,
        icon = d => d.icon,
        type = d => d.type,
        id = d => d.id,
        time = d => d.time, // Expect a Date object
        image = d => d.image,
        userImage = d => d.userImage;

    var ZoomLevel = [
        {width: 26, imageWidth: 50, numChildren: 0},
        {width: 100, numChildren: 0},
        {width: 125, numChildren: 1},
        {width: 150, numChildren: 2}
    ];
    ZoomLevel.forEach(z => {
        z.maxHeight = z.width / 0.75;
    });

    // Rendering options
    var panExtent = [0, 1, 0, 1],
        dragging = false,
        connecting = false,
        senseInput = new SenseInput(senseKnowledge.options),
        minZoomIndex = 0,
        maxZoomIndex = 3,
        defaultZoomIndex = maxZoomIndex,
        zoomLevelIndex = defaultZoomIndex,
        oldZoomLevelIndex,
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
            .domain(['search', 'location', 'dir', 'highlight', 'note', 'filter'])
            .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#e377c2']),
        searchTypes = ['search', 'location', 'dir'],
        iconClassLookup = {search: 'fa-search', location: 'fa-globe', dir: 'fa-street-view', highlight: 'fa-paint-brush',
            note: 'fa-file-text-o', filter: 'fa-filter'
        };
    var drag = d3.behavior.drag()
        .on('dragstart', onNodeDragStart)
        .on('drag', onNodeDrag)
        .on('dragend', onNodeDragEnd);

    // Key function to bind data
    var key = d => d.id;

    // Others
    var dispatch = d3.dispatch('nodeClicked',
        'nodeCollectionRemoved', 'nodeCurationRemoved',
        'nodeFavorite', 'nodeUnfavorite',
        'nodeMinimized', 'nodeRestored',
        'nodeCollectionMoved', 'nodeCurationMoved', 'nodeHovered',
        'linkAdded', 'linkRemoved', 'layoutDone'
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
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .on('click', () => { senseInput.emptySpaceClick(); });
            nodeContainer = container.append('g').attr('class', 'nodes');
            linkContainer = container.append('g').attr('class', 'links');
            cursorLink = container.append('line').attr('class', 'cursor-link hide');

            sm.addPan([nodeContainer, linkContainer, cursorLink], container, panExtent);
            sm.createArrowHeadMarker(self, 'arrow-marker', '#6e6e6e');
            sm.createArrowHeadMarker(self, 'arrow-marker-hover', '#e74c3c');
            sm.createArrowHeadMarker(self, 'arrow-marker-cursor', 'blue');
        }

        dataNodes = (data.nodes || []).filter(n => (n.curated || n.newlyCurated) && !n.curationRemoved);
        dataLinks = (data.links || []).filter(
            l => l.userAdded && !l.removed && dataNodes.includes(l.source) && dataNodes.includes(l.target)
        );
        senseInput.updateNodesLinks(dataNodes, dataLinks);

        // Curated nodes may have smaller set of children than the corresponding in collection
        dataNodes.filter(n => n.slaves).forEach(n => {
            n.rlinks = n.slaves.filter(target => dataNodes.includes(target));
        });

        senseKnowledge.width(width)
            .height(height)
            .label(label)
            .children(children);

        var links = linkContainer.selectAll('.link').data(dataLinks, SenseLink.linkId);
        links.enter().call(enterLinks);
        links.exit().remove();

        var nodes = nodeContainer.selectAll('.node-container').data(dataNodes, key);
        nodes.enter().call(enterNodes);
        nodes.call(updateNodes);
        nodes.exit().remove();

        // Layout DAG
        computeLayout(function() {
            nodes.call(updateNodePositions);
            links.call(updateLinks);
            dataNodes.filter(n => n.newlyCurated).forEach(n => {
                n.newlyCurated = false;
                dispatch.layoutDone(n);
            });
        });

        // Press escape to exit connecting mode
        document.onkeydown = function(e) {
            senseInput.keyHandle(e.keyCode, e.target);
            switch (e.keyCode) {
                case 27: // Esc
                    connecting = false;
                    dragging = false;
                    nodeContainer.selectAll('.node').each(function() {
                        d3.select(this).classed('connect', false);
                    });
                    cursorLink.classed('hide', true);
                    break;
                default:
                    // console.warn('Unknown key code: ' + e.keyCode);
                    break;
            }
        };
    }

    function computeLayout(callback) {
        sm.checkImagesLoaded(container.selectAll('.node-container'), function() {
            // Compute how much space each node needs
            container.selectAll('.node').each(function(d) {
                var r = this.getBoundingClientRect();

                d.curated = d.curated || {x: 0, y: 0};
                d.curated.width = r.width + 1;
                d.curated.height = r.height;
            });
            senseKnowledge.vertices(dataNodes).edges(dataLinks).compute();
            updatePanExtent();
            callback();
        });
    }

    function updatePanExtent() {
        var g = senseKnowledge.size();
        panExtent[1] = Math.max(0, g.width - width + margin.left + margin.right);
        panExtent[3] = Math.max(0, g.height - height + margin.top + margin.bottom);
    }
    /**
     * Activate the node in a browser window
     *
     * @param {Object} node
     */
    function clickNode(node) {
        if (d3.event.defaultPrevented || d3.event.shiftKey) {
            return;
        }
        clearTimeout(connectingTimerId);
        dispatch.nodeClicked(node);
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
            .on('mouseover', function(d) {
                // Align menu to the right side
                var menu = d3.select(this).select('.btn-group').classed('hide', dragging),
                    menuRect = menu.node().getBoundingClientRect(),
                    nodeRect = this.getBoundingClientRect();
                menu.style('left', (nodeRect.right > width - menuRect.width ? 1 - menuRect.width : d.curated.width - 1) + 'px');

                if (dragging) {
                    hideTooltip(this);
                } else {
                    dispatch.nodeHovered(d, true);
                }
            }).on('mouseout', function(d) {
                container.classed('connect', false);
                hideMenu(this);
                dispatch.nodeHovered(d, false);
            });

        var menu = container.append('xhtml:div').attr('class', 'btn-group hide').style('top', '-2px');
        var parent = container.append('xhtml:div').attr('class', 'parent')
            .call(sm.addBootstrapTooltip);

        // Icon
        var titleDiv = parent.append('xhtml:div').attr('class', 'node-title');
        titleDiv.append('xhtml:img').attr('class', 'node-icon');
        titleDiv.append('xhtml:div').attr('class', 'node-icon fa fa-fw');

        // Text
        titleDiv.append('xhtml:div').attr('class', 'node-label').on('click', node => {
            senseInput.clickNodeLabel(d3.event.target, node);
        });

        // Snapshot
        parent.append('xhtml:img').attr('class', 'node-snapshot center-block').on('click', clickNode);

        // Children
        container.append('xhtml:div').attr('class', 'children').on('click', clickNode);

        // Menu action
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
            .attr('title', 'Remove')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed('hide', true);
                d.curationRemoved = true;
                connecting = false;
                clearTimeout(connectingTimerId);
                // Remove connected links
                dataLinks.filter(l => l.source === d || l.target === d).forEach(l => {
                    l.removed = true;
                });
                update(d);
                dispatch.nodeCurationRemoved(d);
            });
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
                .classed('highlighted', isHighlighted(d))
                .classed('brushed', d.curationBrushed && !d.collectionRemoved);

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
            if (zoomLevelIndex === minZoomIndex && finalImage(d)) {
                container.selectAll('.node-icon').classed('hide', true);
            }
            container.select('.node-title').classed('hide', zoomLevelIndex === minZoomIndex && finalImage(d));

            // Text
            container.select('.node-label').text(label)
                .classed('min-zoom', zoomLevelIndex === minZoomIndex)
                .classed('hide', zoomLevelIndex === minZoomIndex && icon(d));

            // Snapshot
            container.select('img.node-snapshot')
                .attr('src', finalImage)
                .classed('hide', !finalImage(d));

            if (d.children) {
                updateChildren(d3.select(this).select('.children'), d);
            }
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

    function finalImage(d) {
        return userImage(d) || image(d);
    }

    /**
     * Scale image, text according to zoom level.
     */
    function scaleNode(self) {
        var d = d3.select(self).datum(),
            isMinZoomFavorite = zoomLevelIndex === minZoomIndex && finalImage(d);
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
            isMinZoomFavorite = zoomLevelIndex === minZoomIndex && finalImage(d),
            childrenHeight = self.querySelector('.children').getBoundingClientRect().height,
            mainHeight = (isMinZoomFavorite ? zoomLevel.maxImageHeight : zoomLevel.maxHeight) - childrenHeight;
        d3.select(self).select('.parent').style('max-height', mainHeight + 'px');
    }

    function updateChildren(container, d) {
        // Enter
        var subItems = container.selectAll('.sub-node')
            .data(d.collectionShowAll ? d.children : _.take(d.children, zoomLevel.numChildren), key);
        var enterItems = subItems.enter().append('div').attr('class', 'sub-node')
            .call(sm.addBootstrapTooltip)
            .on('click', function(d) {
                if (d3.event.defaultPrevented || d3.event.shiftKey) {
                    return;
                }
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
            .attr('id', SenseLink.linkId)
            .attr('class', 'main-link')
            .classed('user-added', d => d.userAdded);

        // Dummy link for easy selection
        container.append('path')
            .attr('id', SenseLink.linkHoverId)
            .attr('class', 'hover-link');

        container.on('mouseover', function(d) {
            SenseLink.menu(true, this, d, dragging);
        }).on('mouseout', function(d) {
            SenseLink.menu(false, this, d, dragging);
        });

        // Menu action
        var menu = container.append('foreignObject')
            .attr('class', 'menu-container')
            .attr('width', '100%').attr('height', '100%')
            .append('xhtml:div').attr('class', 'btn-group hide');

        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-info')
            .style('width', '30px')
            .attr('title', 'Add title')
            .on('click', link => { senseInput.addInputToEdge(link); });

        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
            .attr('title', 'Remove')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed('hide', true);
                d.removed = true;
                update(d);
                dispatch.linkRemoved(d);
            });
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
        var src = l.source,
            dst = l.target,
            centerSource = {x: src.curated.x + src.curated.width / 2, y: src.curated.y + src.curated.height / 2},
            centerTarget = {x: dst.curated.x + dst.curated.width / 2, y: dst.curated.y + dst.curated.height / 2};

        l.rpoints = [sm.getRectEdgePoint(src.curated, centerTarget), sm.getRectEdgePoint(dst.curated, centerSource)];

        return l.rpoints.map(p => ({x: Math.round(p.x) - 0.5, y: Math.round(p.y) - 0.5}));
    }

    function roundPoint(d) {
        return [Math.round(d.curated.x), Math.round(d.curated.y)];
    }

    function updateDragPosition(d) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
    }

    function updateLinkDragPosition(d) {
        var titleDiv = d3.select('#' + SenseLink.linkTitleId(d));
        d3.select('#' + SenseLink.linkId(d)).attr('d', line(roundPoints(d)));
        d3.select('#' + SenseLink.linkHoverId(d)).attr('d', line(roundPoints(d)));
        if (titleDiv.node()) {
            titleDiv.attr('transform', senseInput.getTitleTransform(titleDiv.select('div'), d));
        }
    }

    function onNodeDragStart() {
        var self = this;

        d3.event.sourceEvent.stopPropagation();
        if (d3.event.sourceEvent.which === 1 && !d3.event.sourceEvent.shiftKey) {
            connectingTimerId = setTimeout(function() {
                connecting = true;
                d3.select(self.querySelector('.node')).classed('connect', true);
                hideMenu(self.querySelector('.node'));
            }, 300);
            dragging = true;
        }
        // Bootstrap tooltip appears even when moving the node => disable it
        hideTooltip(this);
    }

    function onNodeDrag(d) {
        if (!dragging) {
            return;
        }

        // Already drag, no need to check
        clearTimeout(connectingTimerId);
        d3.select(this.querySelector('.node')).classed('connect', false);

        hideMenu(this.querySelector('.node'));

        if (connecting) {
            // Draw a link from the node center to the current mouse position
            cursorLink.classed('hide', false);
            cursorLink
                .attr('x1', d.curated.x + Math.round(d.curated.width / 2))
                .attr('y1', d.curated.y + Math.round(d.curated.height / 2))
                .attr('x2', d3.event.x).attr('y2', d3.event.y);
            // Don't know why mouse over other nodes doesn't work. Have to do it manually
            var self = this;
            nodeContainer.selectAll('.node').each(function() {
                d3.select(this).classed('hovered', this.parentNode !== self && this.containsPoint(d3.event.sourceEvent));
            });
        } else {
            this.moveToFront();

            // Update position of the dragging node
            updateDragPosition(d.curated);
            d3.select(this).attr('transform', 'translate(' + roundPoint(d) + ')');

            // And also links
            dataLinks.filter(l => l.source === d || l.target === d).forEach(updateLinkDragPosition);
        }
    }

    function onNodeDragEnd(d) {
        var self = this,
            found = false;

        cursorLink.classed('hide', true);
        if (connecting) {
            nodeContainer.selectAll('.node').each(function(d2) {
                var l, centerSource, centerTarget;

                d3.select(this).classed('hovered', false);

                if (!found && this.parentNode !== self && this.containsPoint(d3.event.sourceEvent)) {
                    // Add a link from the dragging node to the hovering node if not existed
                    l = data.links.find(l => l.source === d && l.target === d2);
                    if (l) {
                        delete l.removed;
                    } else {
                        l = {
                            id: d3.time.format('%Y%m%d%H%M%S')(new Date()),
                            source: d, target: d2,
                            userAdded: true
                        };
                        data.links.push(l);
                        // Find position of two end-points
                        centerSource = {
                            x: l.source.curated.x + l.source.curated.width / 2,
                            y: l.source.curated.y + l.source.curated.height / 2
                        };
                        centerTarget = {
                            x: l.target.curated.x + l.target.curated.width / 2,
                            y: l.target.curated.y + l.target.curated.height / 2
                        };
                        l.rpoints = [
                            sm.getRectEdgePoint(l.source.curated, centerTarget),
                            sm.getRectEdgePoint(l.target.curated, centerSource)
                        ];
                    }
                    found = true;
                    update(d);
                    dispatch.linkAdded(l);
                }
            });
        } else {
            senseKnowledge.calcGridPoint(d.curated);
            d3.select(this).attr('transform', 'translate(' + roundPoint(d) + ')');
            dataLinks.filter(l => l.source === d || l.target === d).forEach(updateLinkDragPosition);
            // Update new graph size to make pan correctly
            updatePanExtent();
            dispatch.nodeCurationMoved(d);
        }

        dragging = connecting = false;
    }

    /**
     * Translate nodes to accommodate the change of zoom level.
     */
    function translateNodes() {
        if (zoomLevelIndex === oldZoomLevelIndex) {
            return;
        }

        var ratio = zoomLevel.width / ZoomLevel[oldZoomLevelIndex].width;
        dataNodes.forEach(n => {
            n.curated.x *= ratio;
            n.curated.y *= ratio;
        });
    }

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
     * Sets brushing status of the given node.
     */
    module.setBrushed = function(id, value) {
        nodeContainer.selectAll('.node').each(function(d) {
            d.curationBrushed = value && key(d) === id && !d.collectionRemoved;
            d3.select(this).classed('brushed', d.curationBrushed);
        });
    };

    /**
     * Increase zoom level.
     */
    module.zoomIn = function() {
        oldZoomLevelIndex = zoomLevelIndex;
        zoomLevelIndex = Math.min(maxZoomIndex, zoomLevelIndex + 1);
        zoomLevel = ZoomLevel[zoomLevelIndex];
        translateNodes();
    };

    /**
     * Reduce zoom level.
     */
    module.zoomOut = function() {
        oldZoomLevelIndex = zoomLevelIndex;
        zoomLevelIndex = Math.max(minZoomIndex, zoomLevelIndex - 1);
        zoomLevel = ZoomLevel[zoomLevelIndex];
        translateNodes();
    };

    /**
     * Resets to the default zoom level.
     */
    module.resetZoom = function() {
        zoomLevelIndex = defaultZoomIndex;
        zoomLevel = ZoomLevel[zoomLevelIndex];
    };

    /**
     * Computes the zoom level based on a series of zooms
     */
    module.computeZoomLevel = function(zooms) {
        zoomLevelIndex = defaultZoomIndex;
        zooms.forEach(z => {
            if (z.type === 'curation-zoom-in') {
                zoomLevelIndex = Math.min(maxZoomIndex, zoomLevelIndex + 1);
            }
            if (z.type === 'curation-zoom-out') {
                zoomLevelIndex = Math.max(minZoomIndex, zoomLevelIndex - 1);
            }
        });
        zoomLevel = ZoomLevel[zoomLevelIndex];
    };

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};
