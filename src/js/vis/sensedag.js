/**
 * sensedag module provides a visualization as a DAG.
 * data: array of { action: ... }
 */
sm.vis.sensedag = function() {
    // Private members
    var width = 400, height = 250,
        margin = { top: 5, right: 5, bottom: 5, left: 5 },
        label = d => d.label,
        icon = d => d.icon,
        type = d => d.type,
        time = d => d.time, // Expect a Date object
        candidate = d => d.candidate;

    // Rendering options
    var layout = sm.layout.dag(),
        intraCellSpacing = 10,
        interRankCellSpacing = 40,
        zoomLevel = 1,
        maxZoomLevel = 2,
        minZoomLevel = 0.2,
        zoomStep = 0.1,
        panExtent = [ 0, 1 ],
        defaultMaxWidth = 100,
        temporalGap = 15, // a gap between 2 nodes to indicate that the later starts after the former
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
        cursorLink, // to draw a link when moving mouse
        marker; // For arrow head

    // d3
    var colorScale = d3.scale.category10()
            .domain([ 'search', 'location', 'dir', 'highlight', 'note', 'filter' ])
            .range([ '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#e377c2' ]),
        relTypes = [ 'link', 'revisit', 'bookmark', 'type' ],
        iconClassLookup = { search: 'fa-search', location: 'fa-globe', dir: 'fa-street-view', highlight: 'fa-paint-brush',
            note: 'fa-file-text-o', filter: 'fa-filter'
        };
    var diagonal = d3.svg.diagonal(),
        line = d3.svg.line()
            .x(d => d.x)
            .y(d => d.y);
    var updateDragPosition = function(d) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
    };
    var drag = d3.behavior.drag()
        .on('dragstart', function(d) {
            dragging = true;
        }).on('drag', function(d) {
            if (connecting) {
                // Draw a link from the node center to the current mouse position
                cursorLink.classed('hide', false);
                cursorLink
                    .attr("x1", d.x + d.width / 2).attr("y1", d.y + d.height / 2)
                    .attr("x2", d3.event.x).attr("y2", d3.event.y);

                // Don't know why mouse over other nodes doesn't work. Have to do it manually
                var self = this;
                nodeContainer.selectAll('.node').each(function() {
                    d3.select(this).classed('hovered', false);

                    if (this.parentNode !== self && this.containsPoint(d3.event.sourceEvent)) {
                        // Highlight
                        d3.select(this).classed('hovered', true);
                    }
                });
            } else {
                // Update position of the dragging node
                updateDragPosition(d);
                d3.select(this).attr('transform', 'translate(' + Math.round(d.x) + ',' + Math.round(d.y) + ')');

                // And also links
                d.inEdges.forEach(l => {
                    // Change only the last two points
                    l.points.slice(l.points.length - 2).forEach(updateDragPosition);
                    d3.select(document.getElementById(linkKey(l))).attr('d', line(l.points));
                });
                d.outEdges.forEach(l => {
                    // Change only the first two points
                    l.points.slice(0, 2).forEach(updateDragPosition);
                    d3.select(document.getElementById(linkKey(l))).attr('d', line(l.points));
                });
            }
        }).on('dragend', function(d) {
            dragging = false;
            d3.select(this).classed('move connect', false);
            cursorLink.classed('hide', true);

            if (connecting) {
                var self = this,
                    found = false;
                nodeContainer.selectAll('.node').each(function(d2) {
                    d3.select(this).classed('hovered', false);

                    if (!found && this.parentNode !== self && this.containsPoint(d3.event.sourceEvent)) {
                        // Add a link from the dragging node to the hovering node if not existed
                        if (data.links.find(l => l.source === d && l.target === d2)) return;

                        data.links.push({ source: d, target: d2 });
                        update();
                        found = true;
                    }
                });
            }
        });

    // Key function to bind data
    var key = d => d.id,
        linkKey = d => key(d.source) + '-' + key(d.target);

    // Others
    var dispatch = d3.dispatch();

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
                .append('g').attr('class', 'sm-sensedag');
            linkContainer = container.append('g').attr('class', 'links');
            nodeContainer = container.append('g').attr('class', 'nodes');
            cursorLink = container.append("line").attr("class", "cursor-link hide").attr('marker-end', 'url(#arrow-marker-cursor)');

            zoomPan();
            sm.createArrowHeadMarker(self, 'arrow-marker', '#bbb');
            sm.createArrowHeadMarker(self, 'arrow-marker-cursor', 'red');
        }

        var links = linkContainer.selectAll('.link').data(data.links, linkKey);
        links.enter().call(enterLinks);
        links.exit().remove();

        var nodes = nodeContainer.selectAll('.node-container').data(data.nodes, key);
        nodes.enter().call(enterNodes);
        nodes.call(updateNodes);
        nodes.exit().remove();

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

        sm.addHorizontalPan(container, panExtent);
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

            callback();
        });
    }

    /**
     * Does stuff when new nodes added (usually called when 'enter').
     */
    function enterNodes(selection) {
        var container = selection.append('foreignObject')
            .attr('class', 'node-container')
            .attr('width', '100%').attr('height', '100%')
            .attr('opacity', 0);

        // Apply drag onto the 'foreignObject'
        container.call(drag);

        var div = container.append('xhtml:div').attr('class', 'node')
            .attr('title', label)
            .on('mousemove', function(d) {
                // Don't revaluate status when the node is being dragged
                if (dragging) return;

                // If mouse is close to the node edges, then 'connect' mode; otherwise, 'move'
                var rect = this.getBoundingClientRect();
                var pad = 6;
                connecting = rect.right - pad < d3.event.x || rect.left + pad > d3.event.x ||
                    rect.top + pad > d3.event.y || rect.bottom - pad < d3.event.y;
                d3.select(this).classed('connect', connecting);
                d3.select(this).classed('move', !connecting);
            });

        // Icon
        div.append('xhtml:img').attr('class', 'node-icon');
        div.append('xhtml:div').attr('class', 'node-icon fa');

        // Text
        div.append('xhtml:div').attr('class', 'node-label');
    }

    /**
     * Does stuff when nodes updated (usually called when 'update').
     */
    function updateNodes(selection) {
        selection.each(function(d) {
            var container = d3.select(this).select('.node');

            // Content type: normal finding or candidate
            container.classed('candidate', candidate(d));

            // Icon: only either favicon or action type is visible
            // If action type is relationship (link, type), show favIcon is more meaningful
            var imgVisible = !type(d) || relTypes.includes(type(d));
            container.select('img.node-icon').attr('src', icon).classed('hide', !imgVisible);
            container.select('div.node-icon').classed(iconClassLookup[type(d)], true).classed('hide', imgVisible)
                .style('background-color', colorScale(type(d)));

            // Text
            container.select('.node-label').text(label)
                .style('max-width', defaultMaxWidth * zoomLevel + 'px');
        });
    }

    /**
     * Separate from updateNodes() because updateNodes() needs to run first to get node sizes.
     */
    function updateNodePositions(selection) {
        selection.each(function(d) {
            d3.select(this).transition()
                .attr('opacity', 1)
                .attr('transform', 'translate(' + Math.round(d.x) + ',' + Math.round(d.y) + ')');

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

        container.append('path')
            .attr('id', linkKey)
            .attr('marker-end', 'url(#arrow-marker)');
    }

    /**
     * Does stuff when link updated (usually called when 'update').
     */
    function updateLinks(selection) {
        selection.each(function(d) {
            var container = d3.select(this).transition()
                .attr('opacity', 1);

            // Set data
            container.select('path').attr('d', line(d.points));
        });
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