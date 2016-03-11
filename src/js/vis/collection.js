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

    // Rendering options
    var layout = sm.layout.dag(),
        panExtent = [ 0, 1, 0, 1 ],
        defaultMaxWidth = 200,
        brushing = false;

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
        'nodeMinimized', 'nodeRestored', 'nodeMoved', 'linkAdded', 'linkRemoved');

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
            sm.createArrowHeadMarker(self, 'arrow-marker-hover', '#1abc9c');
            addBrush();
        }

        dataNodes = (data.nodes || []).filter(n => !n.collectionRemoved);
        dataLinks = (data.links || []).filter(l => !l.source.collectionRemoved && !l.target.collectionRemoved && !l.userAdded);

        layout.width(width)
            .height(height)
            .label(label);

        var links = linkContainer.selectAll('.link').data(dataLinks, linkKey);
        links.enter().call(enterLinks);
        links.exit().transition().duration(500).style('opacity', 0).remove();

        var nodes = nodeContainer.selectAll('.node-container').data(dataNodes, key);
        nodes.enter().call(enterNodes);
        nodes.call(updateNodes);
        nodes.exit().transition().duration(500).style('opacity', 0).remove();

        // Layout DAG
        computeLayout(function() {
            links.call(updateLinks);
            nodes.call(updateNodePositions);
        });

        brushContainer.classed('hide', !curated);
    }

    function addBrush() {
        brush
            .x(d3.scale.identity().domain([0, width]))
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
                d3.select(this).select('path').classed('brushed', l.source.brushed && l.target.brushed);
            });
        }).on('brushend', function () {
            brushing = false;

            // Remove brush effect
            var brushNode = brushContainer.select('.extent').node();
            nodeContainer.selectAll('.node').each(function(d) {
                if (d.brushed) d.curated = true;
                d3.select(this).classed('brushed', false);
            });

            linkContainer.selectAll('.link').each(function(l) {
                d3.select(this).select('path').classed('brushed', false);
            });

            brushContainer.call(brush.clear());

            update();
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
                d3.select(this).select('.btn-group').classed('hide', brushing || d.minimized);

                // Hide tooltip
                if (brushing) {
                    $(this.querySelector('.parent')).tooltip('hide');
                    d3.select(this).selectAll('.sub-node').each(function() {
                        $(this).tooltip('hide');
                    });
                }
            }).on('mouseout', function() {
                d3.select(this).select('.btn-group').classed('hide', true);
            });

        var menu = container.append('xhtml:div').attr('class', 'btn-group hide');
        var parent = container.append('xhtml:div').attr('class', 'parent')
            .call(sm.addBootstrapTooltip);

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
                d.collectionRemoved = true;
                update();
                dispatch.nodeCollectionRemoved(d);
            });

        // Children
        container.append('xhtml:div').attr('class', 'children');
    }

    /**
     * Does stuff when nodes updated (usually called when 'update').
     */
    function updateNodes(selection) {
        selection.each(function(d) {
            d3.select(this).select('.node').classed('mini', d.minimized);
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
                    .classed('hide', !image(d) || !d.userImage && !d.favorite);
                d3.select(this).select('.node').classed('favorite', d.favorite);

                if (d.children) updateChildren(d3.select(this).select('.children'), d);
                container.classed('has-children', d.children);
                d3.select(this).select('.children').classed('hide', !d.children);

                setMaxWidthText(this);
            }
        });
    }

    function isHighlighted(d) {
        return d.highlighted || d.children && d.children.some(c => c.highlighted);
    }

    function buildHTMLTitle(d) {
        if (d.minimized) return 'Restore to full size';

        var s = '';
        if (image(d) && !d.favorite && !d.userImage) {
            s += "<img class='node-snapshot img-responsive center-block' src='" + image(d) + "'/>";
        }

        if (label(d)) {
            s += label(d);
        }

        return s;
    }

    function setMaxWidthText(self) {
        d3.select(self).select('.node').style('max-width', defaultMaxWidth + 'px');
        d3.select(self).selectAll('.node-label')
            .style('max-width', defaultMaxWidth - 40 + 'px');
    }

    function updateChildren(container, d) {
        // Enter
        var subItems = container.selectAll('.sub-node').data(d.children, key);
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
            .style('max-width', (defaultMaxWidth - 10) + 'px');

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

            // Align menu to the right side
            var menu = d3.select(this).select('.btn-group')
                .style('opacity', 0)
                .classed('hide', false);
            var menuRect = menu.node().getBoundingClientRect();
            menu.style('left', (d.x + d.width > width - menuRect.width ? 1 - menuRect.width : d.width - 1) + 'px')
                .style('opacity', 1)
                .classed('hide', true);
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
     * Sets/gets the frozen status.
     */
    module.frozen = function(value) {
        if (!arguments.length) return frozen;
        frozen = value;
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

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};