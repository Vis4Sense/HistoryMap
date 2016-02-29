/**
 * sensemap visualizes user process and allows curating it.
 */
sm.vis.sensemap = function() {
    // Private members
    var width = 400, height = 250,
        margin = { top: 5, right: 5, bottom: 5, left: 5 },
        label = d => d.label,
        icon = d => d.icon,
        type = d => d.type,
        time = d => d.time, // Expect a Date object
        image = d => d.image;

    // Rendering options
    var layout,
        zoomLevel = 1,
        maxZoomLevel = 2,
        minZoomLevel = 0.2,
        zoomStep = 0.1,
        panExtent = [ 0, 1, 0, 1 ],
        defaultMaxWidth = 200,
        rowGap = 10, // vertical gap between 2 rows
        rowHeight, // all nodes have the same height
        rowHeightIncludeGap,
        dragging = false
        connecting = false;

    // For debugging classes in dag algorithm
    var classColorScale = d3.scale.category10();

    // Data
    var data;

    // DOM
    var container, // g element containing the entire visualization
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
    var dispatch = d3.dispatch('nodeClicked', 'nodeMinimized', 'nodeRemoved', 'linkAdded', 'linkRemoved');

    /**
     * Main entry of the module.
     */
    function module(selection) {
        selection.each(function(_data) {
            data = _data;
            data.nodes = data.nodes || [];
            data.links = data.links || [];
            update(this);
        });
    }

    function update(self) {
        // Initialize
        if (!container) {
            container = d3.select(self).append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .append('g').attr('class', 'sm-sensemap');
            linkContainer = container.append('g').attr('class', 'links');
            nodeContainer = container.append('g').attr('class', 'nodes');
            cursorLink = container.append('line').attr('class', 'cursor-link hide').attr('marker-end', 'url(#arrow-marker-cursor)');

            zoomPan();
            sm.createArrowHeadMarker(self, 'arrow-marker', '#6e6e6e');
            sm.createArrowHeadMarker(self, 'arrow-marker-hover', '#1abc9c');
            sm.createArrowHeadMarker(self, 'arrow-marker-cursor', 'red');
        }

        layout = sm.layout.dag()
            .width(width)
            .height(height)
            .label(label);

        var links = linkContainer.selectAll('.link').data(data.links, linkKey);
        links.enter().call(enterLinks);
        links.exit().transition().style('opacity', 0).remove();

        var nodes = nodeContainer.selectAll('.node-container').data(data.nodes, key);
        nodes.enter().call(enterNodes);
        nodes.call(updateNodes);
        nodes.exit().transition().style('opacity', 0).remove();

        // Layout DAG
        computeLayout(function() {
            links.call(updateLinks);
            nodes.call(updateNodePositions);
        });
    }

    function zoomPan() {
        // Add invisible rectangle covering the entire space to listen to mouse event.
        // Otherwise, only zoom when mouse-overing visible items.
        d3.select(container.node().parentNode).on('wheel', () => {
            zoomLevel = Math.max(Math.min(d3.event.wheelDelta > 0 ? zoomLevel + zoomStep : zoomLevel - zoomStep, maxZoomLevel), minZoomLevel);
            update();
        });

        sm.addPan(container, panExtent);
    }

    function computeLayout(callback) {
        sm.checkImagesLoaded(nodeContainer.selectAll('.node-container'), function() {
            // Compute how much space each node needs
            rowHeightIncludeGap = 0;
            nodeContainer.selectAll('.node').each(function(d) {
                var r = this.getBoundingClientRect();
                d.width = r.width;
                rowHeight = d.height = r.height;
                rowHeightIncludeGap = Math.max(rowHeightIncludeGap, rowHeight + rowGap);
            });

            var g = layout.vertices(data.nodes).edges(data.links).compute();
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
                if (d3.event.defaultPrevented) return;
                dispatch.nodeClicked(d);
            }).on('mousemove', function(d) {
                // Don't revaluate status when the node is being dragged
                if (dragging) return;

                // If mouse is close to the node edges, then 'connect' mode; otherwise, 'move'
                var rect = this.getBoundingClientRect(),
                    pad = 6,
                    isOnEdge = rect.right - pad < d3.event.x || rect.left + pad > d3.event.x || rect.top + pad > d3.event.y || rect.bottom - pad < d3.event.y;
                connecting = !d.minimized && isOnEdge;
                d3.select(this).classed('connect', connecting);
            }).on('mouseover', function() {
                d3.select(this).select('.btn-group').classed('hide', dragging);
            }).on('mouseout', function() {
                d3.select(this).select('.btn-group').classed('hide', true);
            }).call(sm.addBootstrapTooltip);

        var menu = container.append('xhtml:div').attr('class', 'btn-group hide')
            .on('mouseover', function() { // Hide tooltip because tooltip is associated with the parent
                $(this.parentNode).tooltip('hide');
            });
        var parent = container.append('xhtml:div').attr('class', 'parent');

        // Icon
        var titleDiv = parent.append('xhtml:div');
        titleDiv.append('xhtml:img').attr('class', 'node-icon');
        titleDiv.append('xhtml:div').attr('class', 'node-icon fa fa-fw');

        // Text
        titleDiv.append('xhtml:div').attr('class', 'node-label');

        // Snapshot
        parent.append('xhtml:img').attr('class', 'node-snapshot img-responsive center-block');

        // Menu action
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-star')
            .attr('title', 'Favorite')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d.favorite = !d.favorite;
                d3.select(this).attr('title', d.favorite ? 'Unfavorite' : 'Favorite')
                    .style('color', d.favorite ? '#f39c12' : 'black');
                update();
            });
        menu.append('xhtml:button').attr('class', 'btn btn-default fa')
            .classed('fa-minus', d => !d.minimized)
            .classed('fa-plus', d => d.minimized)
            .attr('title', d => d.minimized ? 'Restore' : 'Minimize')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d.minimized = !d.minimized;
                d3.select(this).classed('fa-minus', !d.minimized)
                    .classed('fa-plus', d.minimized)
                    .attr('title', d => d.minimized ? 'Restore' : 'Minimize');
                update();
                $(this.parentNode.parentNode).tooltip('hide');
            });
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
            .attr('title', 'Remove')
            .on('click', function(d) {
                d3.event.stopPropagation();
                _.remove(data.nodes, d);
                update();
                dispatch.nodeRemoved(d);
            });

        // Children
        container.append('xhtml:div').attr('class', 'children');
    }

    /**
     * Does stuff when nodes updated (usually called when 'update').
     */
    function updateNodes(selection) {
        selection.each(function(d) {
            d3.select(this).selectAll('.parent, .children').classed('hide', d.minimized);
            d3.select(this).select('.node').classed('mini', d.minimized);

            // Status
            d3.select(this).classed('closed', d.closed)
                .select('.node').classed('highlighted', d.highlighted)
                .classed('not-seen', !d.seen);

            // Tooltip
            d3.select(this).select('.node').attr('data-original-title', buildHTMLTitle(d));

            if (!d.minimized) {
                var typeVisible = searchTypes.includes(type(d)),
                    container = d3.select(this).select('.parent');
                container.select('img.node-icon').attr('src', icon)
                    .classed('hide', typeVisible);
                container.select('div.node-icon')
                    .classed('hide', !typeVisible)
                    .classed(iconClassLookup[type(d)], true)
                    .style('background-color', colorScale(type(d)));

                // Different appearance with/out snapshot
                container.select('div').classed('node-title', image(d) && d.favorite);

                // Text
                container.select('.node-label').text(label);

                // Snapshot
                container.select('img.node-snapshot')
                    .attr('src', image)
                    .classed('hide', !image(d) || !d.favorite);

                if (d.children) updateChildren(d3.select(this).select('.children'), d);
                container.classed('has-children', d.children);
                d3.select(this).select('.children').classed('hide', !d.children);

                setMaxWidthText(this);
            }
        });
    }

    function buildHTMLTitle(d) {
        var s = '';
        if (image(d) && !d.favorite) {
            s += "<img class='node-snapshot img-responsive center-block' src='" + image(d) + "'/>";
        }

        if (label(d)) {
            s += label(d);
        }

        return s;
    }

    function setMaxWidthText(self) {
        var containerWidth = defaultMaxWidth * zoomLevel;
        d3.select(self).select('.node').style('max-width', containerWidth + 'px');

        d3.select(self).selectAll('.node-label')
            .style('max-width', containerWidth - 35 + 'px');
    }

    function updateChildren(container, d) {
        // Enter
        var subItems = container.selectAll('.sub-node').data(d.children, key);
        var enterItems = subItems.enter().append('div').attr('class', 'sub-node')
            .call(sm.addBootstrapTooltip)
            .on('click', function(d) {
                dispatch.nodeClicked(d);
                d3.event.stopPropagation();
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
            .style('max-width', (defaultMaxWidth - 10) * zoomLevel + 'px');

        // Exit
        subItems.exit().transition().style('opacity', 0).remove();
    }

    /**
     * Separate from updateNodes() because updateNodes() needs to run first to get node sizes.
     */
    function updateNodePositions(selection) {
        selection.each(function(d) {
            d3.select(this).transition()
                .attr('opacity', 1)
                .attr('transform', 'translate(' + Math.round(d.x) + ',' + Math.round(d.y) + ')');

            // Align menu to the right side
            var menu = d3.select(this).select('.btn-group')
                .style('opacity', 0)
                .classed('hide', false);
            var menuRect = menu.node().getBoundingClientRect();
            menu.style('left', (d.x + d.width > width - menuRect.width ? -menuRect.width : d.width) + 'px')
                // .style('top', (d.y < menuRect.height ? 25 : -menuRect.height) + 'px')
                .style('opacity', 1)
                .classed('hide', true);

            // For debugging dag classes
            // d3.select(this).select('.node').style('background-color', classColorScale(d.classLabel));
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
            .classed('user-added', d => d.isUserAdded);

        // Dummy link for easy selection
        container.append('path')
            .attr('id', linkHoverKey)
            .attr('class', 'hover-link');

        container.on('mouseover', function() {
            showLinkMenu(true, this);
        }).on('mouseout', function() {
            showLinkMenu(false, this);
        });

        // Menu action
        var menuContainer = container.append('foreignObject')
            .attr('class', 'menu-container')
            .attr('width', '100%').attr('height', '100%');
        menuContainer.append('xhtml:div').attr('class', 'btn-group hide')
            .append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
                .attr('title', 'Remove')
                .on('click', function(d) {
                    d3.event.stopPropagation();
                    _.remove(data.links, d);
                    update();
                    dispatch.linkRemoved(d);
                });
    }

    function showLinkMenu(visible, self) {
        // Link feedback
        d3.select(self).select('.main-link').classed('hovered', visible);

        // Menu
        d3.select(self).select('.btn-group').classed('hide', !visible);
        var menuRect = d3.select(self).select('.btn-group').node().getBoundingClientRect(),
            p = d3.mouse(linkContainer.node()),
            t = [ p[0] - menuRect.width / 2, p[1] ];
        d3.select(self).select('.menu-container')
            .attr('transform', 'translate(' + t + ')');
    }

    /**
     * Does stuff when link updated (usually called when 'update').
     */
    function updateLinks(selection) {
        selection.each(function(d) {
            var container = d3.select(this).transition()
                .attr('opacity', 1);

            // Set data
            container.selectAll('path').attr('d', line(roundPoints(d.points)));
        });
    }

    /**
     * To make the line sharp.
     */
    function roundPoints(points) {
        // stroke-width: 1.5px
        return points.map(p => ({ x: Math.round(p.x) - 0.5, y: Math.round(p.y) - 0.5 }));
    }

    function updateDragPosition(d) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
    }

    function updateLinkDragPosition(d) {
        d3.select(document.getElementById(linkKey(d))).attr('d', line(roundPoints(d.points)));
        d3.select(document.getElementById(linkHoverKey(d))).attr('d', line(roundPoints(d.points)));
    }

    function onNodeDragStart(d) {
        if (d3.event.sourceEvent.which === 1) dragging = true;
    }

    function onNodeDrag(d) {
        if (!dragging) return;

        if (connecting) {
            // Draw a link from the node center to the current mouse position
            cursorLink.classed('hide', false);
            cursorLink
                .attr('x1', d.x + d.width / 2).attr('y1', d.y + d.height / 2)
                .attr('x2', d3.event.x).attr('y2', d3.event.y);

            // Don't know why mouse over other nodes doesn't work. Have to do it manually
            var self = this;
            nodeContainer.selectAll('.node').each(function() {
                d3.select(this).classed('hovered', this.parentNode !== self && this.containsPoint(d3.event.sourceEvent));
            });
        } else {
            this.moveToFront();

            // Update position of the dragging node
            updateDragPosition(d);
            d3.select(this).attr('transform', 'translate(' + Math.round(d.x) + ',' + Math.round(d.y) + ')');

            // And also links
            d.inEdges.forEach(l => {
                // Change only the last two points
                l.points.slice(l.points.length - 2).forEach(updateDragPosition);
                updateLinkDragPosition(l);
            });
            d.outEdges.forEach(l => {
                // Change only the first two points
                l.points.slice(0, 2).forEach(updateDragPosition);
                updateLinkDragPosition(l);
            });

            // Bootstrap tooltip appears even when moving the node => disable it
            $(d3.select(this).select('.node').node()).tooltip('hide');
            d3.select(this).select('.btn-group').classed('hide', true);
        }
    }

    function onNodeDragEnd(d) {
        dragging = false;
        d3.select(this).classed('connect', false);
        cursorLink.classed('hide', true);

        if (connecting) {
            var self = this,
                found = false;
            nodeContainer.selectAll('.node').each(function(d2) {
                d3.select(this).classed('hovered', false);

                if (!found && this.parentNode !== self && this.containsPoint(d3.event.sourceEvent)) {
                    // Add a link from the dragging node to the hovering node if not existed
                    if (data.links.find(l => l.source === d && l.target === d2)) return;

                    var l = { source: d, target: d2, isUserAdded: true };
                    data.links.push(l);

                    found = true;
                    update();
                    dispatch.linkAdded(l);
                }
            });
        }
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

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};