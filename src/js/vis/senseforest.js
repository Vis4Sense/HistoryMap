/**
 * senseforest visualizes a set of tree-like data.
 */
sm.vis.senseforest = function() {
    // Private members
    var width = 400, height = 250,
        margin = { top: 5, right: 5, bottom: 5, left: 5 },
        label = d => d.label,
        icon = d => d.icon,
        type = d => d.type,
        time = d => d.time, // Expect a Date object
        candidate = d => d.candidate;

    // Rendering options
    var layout,
        zoomLevel = 1,
        maxZoomLevel = 2,
        minZoomLevel = 0.2,
        zoomStep = 0.1,
        panExtent = [ 0, 1, 0, 1 ],
        defaultMaxWidth = 150;

    // Data
    var data,
        searchTypes = [ 'search', 'location', 'dir' ],
        iconClassLookup = { search: 'fa-search', location: 'fa-globe', dir: 'fa-street-view', highlight: 'fa-paint-brush',
            note: 'fa-file-text-o', filter: 'fa-filter'
        };

    // DOM
    var container, // g element containing the entire visualization
        nodeContainer, // g element containing all nodes
        linkContainer, // g element containing all links
        marker; // Arrow head

    // d3
    var diagonal,
        line = d3.svg.line()
            .x(d => d.x)
            .y(d => d.y),
        colorScale = d3.scale.category10()
            .domain([ 'search', 'location', 'dir', 'highlight', 'note', 'filter' ])
            .range([ '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#e377c2' ]);

    // Key function to bind data
    var key = d => d.id,
        linkKey = d => key(d.source) + '-' + key(d.target);

    // Others
    var dispatch = d3.dispatch('itemClicked');

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
                .append('g').attr('class', 'sm-sensenav');
            linkContainer = container.append('g').attr('class', 'links');
            nodeContainer = container.append('g').attr('class', 'nodes');

            sm.createArrowHeadMarker(self, 'arrow-marker', '#bbb');
            sm.addPan(container, panExtent);

            diagonal = d3.svg.diagonal()
                .projection(function(d) { return [d.y, d.x]; })
                .source(d => d.points[0])
                .target(d => d.points[1]);
        }

        layout = sm.layout.forest()
            .width(width)
            .height(height)
            .children(d => d.links)
            .parent(d => d.sup)
            .time(time)
            .label(label);

        var links = linkContainer.selectAll('.link').data(data.links, linkKey);
        links.enter().call(enterLinks);
        links.exit().transition().style("opacity", 0).remove();

        var nodes = nodeContainer.selectAll('.node-container').data(data.nodes, key);
        nodes.enter().call(enterNodes);
        nodes.call(updateNodes);
        nodes.exit().transition().style("opacity", 0).remove();

        // Layout DAG
        computeLayout(function() {
            links.call(updateLinks);
            nodes.call(updateNodePositions);
        });
    }

    function computeLayout(callback) {
        sm.checkImagesLoaded(nodeContainer.selectAll('.node-container'), function() {
            // The layout needs to know the size of each node
            nodeContainer.selectAll('.node').each(function(d) {
                var r = this.getBoundingClientRect();
                d.width = r.width;
                d.height = r.height;
            });

            var g = layout.nodes(data.nodes).links(data.links).compute();
            panExtent[1] = Math.max(0, g.width - width + margin.left + margin.right);
            panExtent[3] = Math.max(0, g.height - height + margin.top + margin.bottom);

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

        var div = container.append('xhtml:div').attr('class', 'node')
            .on('click', function(d) {
                if (d3.event.defaultPrevented) return;
                dispatch.itemClicked(d);
            });
        var parent = div.append('xhtml:div').attr('class', 'parent')
            .attr('title', label);

        // Icon
        parent.append('xhtml:img').attr('class', 'node-icon');
        parent.append('xhtml:div').attr('class', 'node-icon fa fa-fw');

        // Text
        parent.append('xhtml:div').attr('class', 'node-label');

        // Children
        div.append('xhtml:div').attr('class', 'children');
    }

    /**
     * Does stuff when nodes updated (usually called when 'update').
     */
    function updateNodes(selection) {
        selection.each(function(d) {
            var container = d3.select(this).select('.parent');

            // Content type: normal finding or candidate
            container.classed('candidate', candidate(d));

            var typeVisible = searchTypes.includes(type(d));
            container.select('img.node-icon').attr('src', icon)
                .classed('hide', typeVisible);
            container.select('div.node-icon')
                .classed('hide', !typeVisible)
                .classed(iconClassLookup[type(d)], true)
                .style('background-color', colorScale(type(d)));

            // Status
            d3.select(this).classed('closed', d.closed);
            d3.select(this).select('.node').classed('highlighted', d.highlighted);

            // Text
            container.select('.node-label').text(label)
                .style('max-width', defaultMaxWidth * zoomLevel + 'px');

            if (d.children) updateChildren(d3.select(this).select('.children'), d);
            container.classed('has-children', d.children);
            d3.select(this).select('.children').classed('hide', !d.children);
        });
    }

    function updateChildren(container, d) {
        // Enter
        var subItems = container.selectAll(".sub-node").data(d.children, key);
        var enterItems = subItems.enter().append("div").attr("class", "sub-node")
            .attr('title', label)
            .on('click', function(d) {
                dispatch.itemClicked(d);
                d3.event.stopPropagation();
            });

        // - Icon
        enterItems.append('xhtml:div').attr('class', 'node-icon fa fa-fw');

        // - Text
        enterItems.append('xhtml:div').attr('class', 'node-label');

        // Update
        subItems.each(function(d2) {
            d3.select(this).select('.node-icon')
                .classed(iconClassLookup.note + ' ' + iconClassLookup.highlight, false)  // reset first
                .classed(iconClassLookup[type(d2)], true)
                .style('background-color', colorScale(type(d2)));
        });
        subItems.select(".node-label").text(label)
            .style('max-width', defaultMaxWidth * zoomLevel + 'px');

        // Exit
        subItems.exit().transition().style("opacity", 0).remove();
    }

    /**
     * Separate from updateNodes() because updateNodes() needs to run first to get node sizes.
     */
    function updateNodePositions(selection) {
        selection.each(function(d) {
            d3.select(this).transition()
                .attr('opacity', 1)
                .attr('transform', 'translate(' + Math.round(d.x) + ',' + Math.round(d.y) + ')');
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
            // container.select('path').attr('d', diagonal);
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
     * Sets/gets the time accessor.
     */
    module.time = function(value) {
        if (!arguments.length) return time;
        time = value;
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