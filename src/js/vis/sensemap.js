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
        image = d => d.image,
        frozen = false; // Stop running the layout

    // Rendering options
    var layout = sm.layout.dag(),
        panExtent = [ 0, 1, 0, 1 ],
        removedPanExtent = [ 0, 1 ],
        defaultMaxWidth = 200,
        rowGap = 10, // vertical gap between 2 rows
        dragging = false
        connecting = false;

    // For debugging classes in dag algorithm
    var classColorScale = d3.scale.category10();

    // Data
    var data,
        dataNodes,
        dataLinks,
        dataRemovedNodes;

    // DOM
    var parentContainer, // g element containing the entire visualization
        container, // g element containing the main, non-clipped visualization
        nodeContainer, // g element containing all nodes
        linkContainer, // g element containing all links
        removedNodeContainer, // g element containing all removed nodes
        clipPath,
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
    var dispatch = d3.dispatch('nodeClicked', 'nodeRemoved', 'renoded', 'nodeFavorite', 'nodeUnfavorite', 'nodeMinimized',
        'nodeRestored', 'nodeMoved', 'linkAdded', 'linkRemoved', 'linkHidden', 'relinked');

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
            parentContainer = d3.select(self).append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .append('g').attr('class', 'sm-sensemap');
            container = parentContainer.append('g').attr('clip-path', 'url(#clip-path)');
            nodeContainer = container.append('g').attr('class', 'nodes');
            linkContainer = container.append('g').attr('class', 'links');
            removedNodeContainer = d3.select(container.node().parentNode).append('g').attr('class', 'removed-nodes');
            removedNodeContainer.append('line');
            clipPath = d3.select(self).append('clipPath').attr('id', 'clip-path').append('rect');
            cursorLink = container.append('line').attr('class', 'cursor-link hide');

            sm.addPan([ nodeContainer, linkContainer, cursorLink ], container, panExtent);
            addRemovedNodesPan(removedPanExtent);
            sm.createArrowHeadMarker(self, 'arrow-marker', '#6e6e6e');
            sm.createArrowHeadMarker(self, 'arrow-marker-hover', '#1abc9c');
            sm.createArrowHeadMarker(self, 'arrow-marker-cursor', '#d52b1e');
        }

        dataNodes = (data.nodes || []).filter(n => !n.removed);
        dataRemovedNodes = (data.nodes || []).filter(n => n.removed);
        dataLinks = (data.links || []).filter(l => !l.source.removed && !l.target.removed);

        layout.width(width)
            .height(height)
            .label(label);

        updateClip();

        var links = linkContainer.selectAll('.link').data(dataLinks, linkKey);
        links.enter().call(enterLinks);
        links.exit().transition().duration(500).style('opacity', 0).remove();

        var nodes = nodeContainer.selectAll('.node-container').data(dataNodes, key);
        nodes.enter().call(enterNodes);
        nodes.call(updateNodes);
        nodes.exit().transition().duration(500).style('opacity', 0).remove();

        var removedNodes = removedNodeContainer.selectAll('.node-container').data(dataRemovedNodes, key);
        removedNodes.enter().call(enterNodes);
        removedNodes.call(updateNodes);
        removedNodes.exit().transition().duration(500).style('opacity', 0).remove();

        // Layout DAG
        computeLayout(function() {
            links.call(updateLinks);
            nodes.call(updateNodePositions);
            removedNodes.call(updateNodePositions);
        });
    }

    function addRemovedNodesPan(extent) {
        var pan = function(offset) {
            var t = d3.transform(removedNodeContainer.attr("transform"));
            t.translate[0] = Math.round(Math.max(-extent[1], Math.min(extent[0], t.translate[0] + offset)));
            removedNodeContainer.attr("transform", "translate(" + t.translate + ")");
        };

        removedNodeContainer.insert("rect", ":first-child")
            .style("fill", "none")
            .style("pointer-events", "all");

        // Wheel
        removedNodeContainer.on('wheel', function() {
            pan(-d3.event.deltaX || -d3.event.deltaY);
            d3.event.stopPropagation();
        });
    }

    function updateClip() {
        clipPath.attr('x', 0).attr('y', 0).attr('width', width);
    }

    function computeLayout(callback) {
        sm.checkImagesLoaded(parentContainer.selectAll('.node-container'), function() {
            // Compute how much space each node needs
            parentContainer.selectAll('.node').each(function(d) {
                var r = this.getBoundingClientRect();
                d.width = r.width;
                d.height = r.height;
            });

            // DAG for nodes
            layout.vertices(dataNodes).edges(dataLinks);

            if (frozen) {
                layout.update();
            } else {
                var g = layout.compute();
                panExtent[1] = Math.max(0, g.width - width + margin.left + margin.right);
                panExtent[3] = g.height - height + margin.top + margin.bottom + 1;
            }

            // Linear for removed nodes
            computeRemovedNodesLayout();

            callback();
        });
    }

    function computeRemovedNodesLayout() {
        // Rearrange container
        var removedNodesHeight = dataRemovedNodes.length ? d3.max(dataRemovedNodes, n => n.height) : 0,
            nodesHeight = height - margin.top - margin.bottom - removedNodesHeight,
            twoPartsGap = dataRemovedNodes.length ? margin.top * 4 : 0;
            clipPathHeight = nodesHeight - twoPartsGap;
        clipPath.attr('height', clipPathHeight);

        panExtent[3] = Math.max(0, panExtent[3] + removedNodesHeight + twoPartsGap);

        // Set location
        var x = 0;
        dataRemovedNodes.sort((a, b) => d3.descending(+a.removedTime, +b.removedTime))
            .forEach(n => {
                n.x = x;
                x += n.width + 15;
                n.y = nodesHeight;
            });

        var removedWidth = dataRemovedNodes.length ? d3.max(dataRemovedNodes, n => n.x + n.width) : 0;
        removedPanExtent[1] = Math.max(0, removedWidth - width + margin.left + margin.right);

        // Update line
        removedNodeContainer.select('line').classed('hide', !dataRemovedNodes.length)
            .attr('x1', -margin.left)
            .attr('y1', nodesHeight - margin.top * 2)
            .attr('x2', Math.max(removedWidth, width))
            .attr('y2', nodesHeight - margin.top * 2);

        // Update covering rect for mouse wheel
        removedNodeContainer.select('rect')
            .attr('y', nodesHeight - margin.top * 2)
            .attr('width', Math.max(removedWidth, width))
            .attr('height', removedNodesHeight);
    }

    /**
     * Does stuff when new nodes added (usually called when 'enter').
     */
    function enterNodes(selection) {
        var fo = selection.append('foreignObject')
            .attr('class', 'node-container')
            .attr('width', '100%').attr('height', '100%')
            .attr('opacity', 0)
            .each(function(d) { // Give update an original location
                if (d.x !== undefined && d.y !== undefined) {
                    d3.select(this).attr('transform', 'translate(' + roundPoint(d) + ')');
                }
            });

        // Apply drag onto the 'foreignObject'
        fo.call(drag);

        var container = fo.append('xhtml:div').attr('class', 'node')
            .on('click', function(d) {
                if (d.minimized) {
                    d.minimized = false;
                    update();
                    dispatch.nodeRestored(d);
                } else if (d.removed) {
                    d.removed = false;
                    update();
                    dispatch.renoded(d);
                } else {
                    if (d3.event.defaultPrevented) return;
                    dispatch.nodeClicked(d);
                }
                $(d3.select(this).select('.parent').node()).tooltip('hide');
            }).on('mousemove', function(d) {
                // Don't revaluate status when the node is being dragged
                if (dragging) return;

                // If mouse is close to the node edges, then 'connect' mode; otherwise, 'move'
                var rect = this.getBoundingClientRect(),
                    pad = 6,
                    isOnEdge = rect.right - pad < d3.event.x || rect.left + pad > d3.event.x || rect.top + pad > d3.event.y || rect.bottom - pad < d3.event.y;
                connecting = !d.minimized && !d.removed && isOnEdge;
                d3.select(this).classed('connect', connecting);
            }).on('mouseover', function(d) {
                d3.select(this).select('.btn-group').classed('hide', dragging || d.minimized || d.removed);
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
                d.minimized = true;
                update();
                dispatch.nodeMinimized(d);
            });
        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-remove')
            .attr('title', 'Remove')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d.removed = true;
                d.removedTime = new Date();
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
            d3.select(this).select('.node').classed('mini', d.minimized);
            d3.select(this).selectAll('.parent, .children').classed('hide', d.minimized);

            // Status
            d3.select(this).select('.node')
                .classed('not-seen', !d.seen)
                .classed('closed', d.closed)
                .classed('highlighted', d.highlighted || isChildHighlighted(d))
                .classed('removed', d.removed);

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
                container.select('div').classed('node-title', image(d) && d.favorite && !d.removed);

                // Text
                container.select('.node-label').text(label);

                // Snapshot
                container.select('img.node-snapshot')
                    .attr('src', image)
                    .classed('hide', !image(d) || !d.favorite || d.removed);
                d3.select(this).select('.node').classed('favorite', d.favorite);

                if (d.children && !d.minimized && !d.removed) updateChildren(d3.select(this).select('.children'), d);
                container.classed('has-children', d.children && !d.removed);
                d3.select(this).select('.children').classed('hide', !d.children || d.removed);

                setMaxWidthText(this);
            }
        });
    }

    function isChildHighlighted(d) {
        if (!d.children || !d.children.length) return false;

        return d.children.some(c => c.highlighted);
    }

    function buildHTMLTitle(d) {
        if (d.removed) return 'Add it back';
        if (d.minimized) return 'Restore to full size';

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
        d3.select(self).select('.node').style('max-width', defaultMaxWidth + 'px');
        d3.select(self).selectAll('.node-label')
            .style('max-width', defaultMaxWidth - 35 + 'px');
    }

    function updateChildren(container, d) {
        // Enter
        var subItems = container.selectAll('.sub-node').data(d.children, key);
        var enterItems = subItems.enter().append('div').attr('class', 'sub-node')
            .call(sm.addBootstrapTooltip)
            .on('click', function(d) {
                if (d3.event.defaultPrevented) return;
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
                .attr('opacity', d.closed ? 0.6 : 1)
                .attr('transform', 'translate(' + roundPoint(d) + ')');

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
            .attr('class', 'hover-link')
            .on('click', function(d) {
                if (d.hidden) {
                    d.hidden = false;
                    d3.event.stopPropagation();
                    update();
                    dispatch.relinked(d);
                }
            });

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
                _.remove(data.links, d);
                update();
                dispatch.linkRemoved(d);
            });

        menu.append('xhtml:button').attr('class', 'btn btn-default fa fa-eye-slash')
            .attr('title', 'Hide')
            .on('click', function(d) {
                d3.event.stopPropagation();
                d.hidden = true;
                d.showHiddenLink = false;
                d3.select(this.parentNode).classed('hide', true);
                update();
                dispatch.linkHidden(d);
            });

        container.append('title');
    }

    function showLinkMenu(visible, self) {
        // Link feedback
        d3.select(self).select('.main-link').classed('hovered', visible);

        var d = d3.select(self).datum();
        d3.select(self).select('.btn-group').classed('hide', !visible || d.hidden);

        // Menu: show it at the middle of the link : sometimes, menu disappear along the way
        var m = d.points.length / 2,
            w = d3.select(self).select('.btn-group').node().getBoundingClientRect().width / 2,
            t = [ d.points.length % 2 ? d.points[m - 0.5].x : (d.points[m].x + d.points[m - 1].x) / 2 - w,
                d.points.length % 2 ? d.points[m - 0.5]. y : (d.points[m].y + d.points[m - 1].y) / 2 - w ];

        d3.select(self).select('.menu-container').attr('transform', 'translate(' + t + ')');

        // Show hidden link
        if (d.hidden) {
            d.showHiddenLink = visible;
            d3.select(self).select('.main-link').attr('d', line(roundPoints(d))).classed('temp-link', visible);
        }
    }

    /**
     * Does stuff when link updated (usually called when 'update').
     */
    function updateLinks(selection) {
        selection.each(function(d) {
            d3.select(this).transition().duration(500).attr('opacity', d.target.closed ? 0.6 : 1);

            var container = d3.select(this);

            // Set data
            container.selectAll('path').transition().duration(500).attr('d', line(roundPoints(d)));

            container.selectAll('path')
                .classed('hidden', d.hidden)
                .classed('temp-link', d.showHiddenLink);

            container.select('title').text(d.hidden ? 'Relink' : '');
        });
    }

    /**
     * To make the line sharp.
     */
    function roundPoints(d) {
        // stroke-width: 1.5px
        var points = d.points;
        if (d.hidden && !d.showHiddenLink) {
            points = d.points.slice(0, 2);
            points[1].x = points[0].x + 10;
        }

        return points.map(p => ({ x: Math.round(p.x) - 0.5, y: Math.round(p.y) - 0.5 }));
    }

    function roundPoint(p) {
        return [ Math.round(p.x), Math.round(p.y) ];
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
        if (d3.event.sourceEvent.which === 1 && !d.removed) {
            dragging = true;
            d3.event.sourceEvent.stopPropagation();
        }
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
            d3.select(this).attr('transform', 'translate(' + roundPoint(d) + ')');

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
            $(d3.select(this).select('.parent').node()).tooltip('hide');
            d3.select(this).selectAll('.sub-node').each(function() {
                $(this).tooltip('hide');
            });
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
        } else {
            dispatch.nodeMoved(d);
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

    /**
     * Sets/gets the frozen status.
     */
    module.frozen = function(value) {
        if (!arguments.length) return frozen;
        frozen = value;
        return this;
    };

    // Binds custom events
    d3.rebind(module, dispatch, 'on');

    return module;
};