/**
 * collection visualizes user browsing process.
 */
sm.vis.collection = function() {
    // Private members
    var width = 400, height = 250,
        margin = { top: 5, right: 5, bottom: 5, left: 5 },
        label = d => d.label,
        icon = d => d.icon,
        type = d => d.type,
        time = d => d.time, // Expect a Date object
        image = d => d.image,
        curated = false, // True to switch on selection for curation
        paused = false; // Suspend collecting

    var ZoomLevel = [
        { width: 26, numChildren: 0, fontSize: 10 },
        { width: 100, numChildren: 0, fontSize: 14 },
        { width: 125, numChildren: 1, fontSize: 16 },
        { width: 150, numChildren: 2, fontSize: 18 }
    ];
    ZoomLevel.forEach(z => {
        z.maxHeight = z.width / 0.75;
    });

    // Rendering options
    var layout = sm.layout.forest(),
        panExtent = [ 0, 1, 0, 1 ],
        brushing = false,
        minZoomIndex = 0,
        maxZoomIndex = 3,
        zoomLevelIndex = maxZoomIndex,
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
            .domain([ 'search', 'location', 'dir', 'highlight', 'note', 'filter' ])
            .range([ '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#e377c2' ]),
        searchTypes = [ 'search', 'location', 'dir' ],
        iconClassLookup = { search: 'fa-search', location: 'fa-globe', dir: 'fa-street-view', highlight: 'fa-paint-brush',
            note: 'fa-file-text-o', filter: 'fa-filter'
        };

    // Key function to bind data
    var key = d => d.id,
        linkKey = d => key(d.source) + '-' + key(d.target);

    // Others
    var dispatch = d3.dispatch('nodeClicked', 'nodeCollectionRemoved', 'nodeCurationRemoved', 'nodeFavorite', 'nodeUnfavorite',
        'nodeMinimized', 'nodeRestored', 'nodeMoved', 'nodeHovered', 'linkAdded', 'linkRemoved', 'curationChanged');

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

            sm.addPan([ nodeContainer, linkContainer ], container, panExtent);
            sm.createArrowHeadMarker(self, 'arrow-marker', '#6e6e6e');
            sm.createArrowHeadMarker(self, 'arrow-marker-hover', '#e74c3c');
            addBrush();
        }

        dataNodes = (data.nodes || []).filter(n => !n.collectionRemoved);
        dataLinks = (data.links || []).filter(l => !l.source.collectionRemoved && !l.target.collectionRemoved && !l.userAdded);

        layout.width(width)
            .height(height)
            .label(label);

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
        computeLayout(function() {
            links.call(updateLinks);
            nodes.call(updateNodePositions);
        });

        brushContainer.classed('hide', !curated);
    }

    function addBrush() {
        brush.x(d3.scale.identity().domain([0, width]))
            .y(d3.scale.identity().domain([0, height]))
        .on('brushstart', function () {
            brushing = true;
        }).on('brush', function () {
            // Brush nodes and links
            var brushNode = brushContainer.select('.extent').node();
            nodeContainer.selectAll('.node').each(function(d) {
                d.brushed = this.intersect(brushNode);
                d3.select(this).classed('brushed', d.brushed);
            });

            linkContainer.selectAll('.link').each(function(l) {
                l.brushed = l.source.brushed && l.target.brushed;
                d3.select(this).select('path').classed('brushed', l.brushed);
            });
        }).on('brushend', function () {
            brushing = false;
            var changed = false;

            // Remove brush effect
            nodeContainer.selectAll('.node').each(function(d) {
                if (d.brushed && !d.curated) {
                    changed = d.curated = true;
                    d.newlyCurated = true;
                    d.curationRemoved = false; // Make sure if this node was removed, it reappears
                }
                d3.select(this).classed('brushed', false);
            });

            linkContainer.selectAll('.link').each(function(l) {
                if (l.brushed) {
                    l.removed = false; // Make sure if this link was removed, it reappears
                    changed = true;
                }
                d3.select(this).select('path').classed('brushed', false);
            });

            brushContainer.call(brush.clear());

            update();

            if (changed) dispatch.curationChanged();
        });

        brushContainer.call(brush);
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

        var container = fo.append('xhtml:div').attr('class', 'node')
            .on('click', function(d) {
                if (d3.event.shiftKey) return;

                if (d.minimized) {
                    d.minimized = false;
                    update();
                    dispatch.nodeRestored(d);
                } else {
                    if (d3.event.defaultPrevented) return;
                    dispatch.nodeClicked(d);
                }
            }).on('mouseover', function(d) {
                // Align menu to the right side
                var menu = d3.select(this).select('.btn-group').classed('hide', brushing || d.minimized),
                    menuRect = menu.node().getBoundingClientRect(),
                    nodeRect = this.getBoundingClientRect();
                menu.style('left', (nodeRect.right > width - menuRect.width ? 1 - menuRect.width : d.width - 1) + 'px');

                // Hide tooltip
                if (brushing) {
                    $(this.querySelector('.parent')).tooltip('hide');
                    d3.select(this).selectAll('.sub-node').each(function() {
                        $(this).tooltip('hide');
                    });
                } else if (d.curated) {
                    dispatch.nodeHovered(d, true);
                }
            }).on('mouseout', function(d) {
                d3.select(this).select('.btn-group').classed('hide', true);

                if (d.curated) {
                    dispatch.nodeHovered(d, false);
                }
            });

        // To indicated if the node is curated
        container.append('xhtml:div').attr('class', 'node-curated fa fa-check-square hide');

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
        parent.append('xhtml:img').attr('class', 'node-snapshot');

        // Menu action
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-star')
            .attr('title', d => d.favorite ? 'Unfavorite' : 'Favorite')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed('hide', true);
                d.favorite = !d.favorite;
                d3.select(this).attr('title', d.favorite ? 'Unfavorite' : 'Favorite')
                    .style('color', d.favorite ? '#f39c12' : 'black');
                update();

                if (d.favorite) {
                    dispatch.nodeFavorite(d);
                } else {
                    dispatch.nodeUnfavorite(d);
                }
            });
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-minus')
            .attr('title', 'Minimize')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed('hide', true);
                d.minimized = true;
                update();
                dispatch.nodeMinimized(d);
            });
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
            .attr('title', 'Remove')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed('hide', true);
                d3.select(this.parentNode.parentNode).classed('hovered', false);
                d.collectionRemoved = true;
                update();
                dispatch.nodeCollectionRemoved(d);
            });

        // Children
        var children = container.append('xhtml:div').attr('class', 'children')
            .on('mouseover', function(d) {
                // Align menu to the right side
                var menu = d3.select(this).select('.show-all-highlights').classed('hide', false),
                    menuRect = menu.node().getBoundingClientRect(),
                    nodeRect = this.getBoundingClientRect();
                menu.style('left', (nodeRect.right > width - menuRect.width ? 1 - menuRect.width : d.width - 1) + 'px');
            }).on('mouseout', function() {
                d3.select(this).select('.show-all-highlights').classed('hide', true);
            });
        children.append('xhtml:button').attr('class', 'btn btn-default hide show-all-highlights').text('Show All')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d3.select(this).classed('hide', true);
                d.collectionShowAll = !d.collectionShowAll;
                d3.select(this).text(d.collectionShowAll ? 'Show Less' : 'Show All');
                update();
            });
    }

    /**
     * Does stuff when nodes updated (usually called when 'update').
     */
    function updateNodes(selection) {
        selection.each(function(d) {
            d3.select(this).select('.node').classed('mini', d.minimized)
                .attr('title', d.minimized ? 'Maximize': '');
            d3.select(this).selectAll('.parent, .children').classed('hide', d.minimized);

            // Status
            d3.select(this).select('.node')
                .classed('not-seen', !d.seen)
                .classed('highlighted', isHighlighted(d));

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
                    .style('background-color', colorScale(type(d)));

                // Show image only in min zoom
                if (zoomLevelIndex === minZoomIndex && image(d) && d.favorite) {
                    container.selectAll('.node-icon').classed('hide', true);
                }
                container.select('.node-title').classed('hide', zoomLevelIndex === minZoomIndex && image(d) && d.favorite);

                // Text
                container.select('.node-label').text(label)
                    .classed('min-zoom', zoomLevelIndex === minZoomIndex)
                    .classed('hide', zoomLevelIndex === minZoomIndex && icon(d));

                // Snapshot
                container.select('img.node-snapshot')
                    .attr('src', image)
                    .classed('hide', !image(d) || !d.userImage && !d.favorite);
                d3.select(this).select('.node').classed('favorite', d.favorite);

                if (d.children) updateChildren(d3.select(this).select('.children'), d);
                container.classed('has-children', d.children && zoomLevel.numChildren);
                d3.select(this).select('.children').classed('hide', !d.children || !zoomLevel.numChildren);

                // Set here first to limit the size before running the layout.
                // Then set again in nodePositions when images loaded.
                scaleNode(this);
            } else {
                d3.select(this).select('.node').style('width', '8px');
            }
        });
    }

    function isHighlighted(d) {
        return d.highlighted || d.children && d.children.some(c => c.highlighted);
    }

    function buildHTMLTitle(d) {
        var s = '';
        if (image(d) && !d.favorite && !d.userImage) {
            s += "<img class='node-snapshot img-responsive center-block' src='" + image(d) + "'/>";
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
            isMinZoomFavorite = zoomLevelIndex === minZoomIndex && d.favorite && image(d);
        d3.select(self).select('.node').style('width', (isMinZoomFavorite ? zoomLevel.width * 2 : zoomLevel.width) + 'px');

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
            isMinZoomFavorite = zoomLevelIndex === minZoomIndex && d.favorite && image(d),
            childrenHeight = self.querySelector('.children').getBoundingClientRect().height,
            mainHeight = (isMinZoomFavorite ? zoomLevel.maxHeight * 2 : zoomLevel.maxHeight) - childrenHeight;
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

            // Curated indication
            var nc = d3.select(this).select('.node-curated')
                .classed('hide', !d.curated)
                .style('top', d.minimized ? '-3px' : '-1px');
            var w = nc.node().getBoundingClientRect().width;
            nc.style('left', (d.minimized ? -2 : d.width - w - 1) + 'px');

            if (!d.minimized) scaleNode(this);
        });
    }

    /**
     * Does stuff when new links added (usually called when 'enter').
     */
    function enterLinks(selection) {
        var container = selection.append('g').attr('class', 'link')
            .attr('opacity', 0);

        container.append('path').attr('class', 'main-link');
    }

    /**
     * Does stuff when link updated (usually called when 'update').
     */
    function updateLinks(selection) {
        selection.each(function(d) {
            d3.select(this).transition().duration(500).attr('opacity', 1);
            d3.select(this).select('path').transition().duration(500).attr('d', line(roundPoints(d)));

            // A straight line goes through minimized node
            var isThrough = d.target.minimized && d.target.links && d.target.links.some(l => !l.collectionRemoved);
            d3.select(this).select('path').classed('straight-arrow', isThrough);
        });
    }

    /**
     * To make the line sharp.
     */
    function roundPoints(d) {
        // stroke-width: 1.5px
        return d.points.map(p => ({ x: Math.round(p.x) - 0.5, y: Math.round(p.y) - 0.5 }));
    }

    function roundPoint(d) {
        return [ Math.round(d.x), Math.round(d.y) ];
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
     * Sets/gets the curated status.
     */
    module.curated = function(value) {
        if (!arguments.length) return curated;
        curated = value;
        brushContainer.classed('hide', !curated);
        return this;
    };

    /**
     * Sets hovering status of the given node.
     */
    module.setHovered = function(id, value) {
        nodeContainer.selectAll('.node').each(function(d) {
            d3.select(this).classed('hovered', value && key(d) === id);
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