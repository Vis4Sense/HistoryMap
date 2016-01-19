/**
 * sensepath visualizes the sensemaking process.
 */
sm.vis.sensepath = function() {
    // Private members
    var width = 400, height = 250,
        presentationMode = false, // Increase size of details to make the vis more visible
        itemPadding = 5,
        endItemPadding = 5,
        sideEndItemPadding = 5,
        groupPadding = presentationMode ? 20 : 10,
        rowPadding = 5,
        maxItemHeight = 150,
        colorScale = d3.scale.category10()
            .domain([ "search", "location", "dir", "highlight", "note", "image", "filter", "read", "talk" ])
            .range([ "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf" ]),
        zoomLevel = 1,
        view = "text",
        scaleTime = true, // Does item width scale with time?
        startRecordingTime,
        time = function(d) { return d.time instanceof Date ? d.time : new Date(d.time); }, // Accessor of the item's time
        endTime = function(d) { return d.endTime instanceof Date ? d.endTime : d.endTime ? new Date(d.endTime) : d.endTime; }, // Accessor of the item's end time
        type = function(d) { return d.type; }, // Accessor of type to indicate what text is about
        text = function(d) { return d.text; }, // Accessor of display text (title, highlight, note)
        url = function(d) { return d.url; }, // Accessor of url
        image = function(d) { return d.image; }, // Accessor of image
        path = function(d) { return d.path; }, // Accessor of the XPath locating the element
        icon = function(d) { return d.favIconUrl; }, // Accessor of the element's icon
        key = function(d) { return d.id; }, // Uniquely bind item to element
        linkKey = function(d) { return key(d.source) + "-" + key(d.target); },
        groupKey = function(d) { return d.id; }; // Uniquely bind group to element

    // DOM
    var _container, // Contain the entire visualization
        parent, // The input container (parent of _container)
        svgContainer,
        groupContainer,
        itemContainer,
        tagInputContainer,
        transcriptInputContainer,
        brushContainer,
        marker; // For arrow head

    // Layout
    var availableWidth,
        maxItemWidth,
        maxItemTextWidth,
        minItemWidth,
        minItemTextWidth,
        minUnderstandableWidth,
        itemHeight,
        rowHeight,
        textViewGroupHeight,
        rowTextHeight,
        widthScale = d3.scale.linear(),
        groupLabelHeight = presentationMode ? 35: 20,
        toolbarWidth,
        iconOnlyWidthPadding = presentationMode ? 56 : 28, // Use for items
        iconOnlyWidth = presentationMode ? 40 : 20, // Use for sub-items
        defaultZoomLevel = 2.2,
        zoomStep = 0.3,
        minZoomLevel = 0.25,
        maxZoomLevel = 10,
        minTimeFilter = 1, // Filtered out all items that have browsing time less than this value
        duration = 500,
        brush,
        showLinks = false,
        mergeRevisits = false;

    // Data
    var fullData, data, nonEmbeddedData, nonEmbeddedDataWithoutRevisits,
        fullLinkData, linkData,
        groupData,
        activeItem, // The item that being clicked, used for assigning theme
        dataChanged = true; // To distinguish the changes that need to recompute data;

    // d3
    var line = d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; });

    // Others
    var iconClassLookup = { search: "fa-search", location: "fa-globe", dir: "fa-street-view", link: "fa-link",
            type: "fa-keyboard-o", bookmark: "fa-bookmark", revisit: "fa-undo", highlight: "fa-paint-brush", note: "fa-file-text-o",
            image:"fa-image", filter: "fa-filter", read: "fa-book", talk: "fa-commenting-o", unknown: "fa-question"
        }, actionDisplayNameLookup = { search: "web search", location: "location search", dir: "direction search",
            link: "link follow", type: "address type", bookmark: "bookmark select", revisit: "page revisited", unknown: "unknown source",
            highlight: "highlight", note: "note", image: "image", filter: "filter", read: "read", talk: "talk"
        }, embeddedTypes = [ "highlight", "note", "image", "filter", "talk" ],
        searchTypes = [ "search", "location", "dir" ],
        relTypes = [ "link", "revisit", "bookmark", "type" ],
        brushing = false,
        timeoutId,
        hourFormat = d3.time.format("%H:%M:%S"),
        tagList = {},
        dispatch = d3.dispatch("itemClicked", "itemsSelected");

    /**
     * Main entry of the module.
     */
    function module(selection) {
        selection.each(function(_data) {
            fullData = _data.nodes;
            fullLinkData = _data.links;
            parent = d3.select(this);
            update(this);
        });
    }

    function update(self) {
        // Initialize
        if (!_container) {
            _container = parent.append("div").attr("class", "sm-sensepath");
            groupContainer = _container.append("div").attr("class", "sm-sensepath-groups");
            itemContainer = _container.append("div").attr("class", "sm-sensepath-items");
            svgContainer = _container.append("svg").attr("class", "sm-sensepath-svg");
            linkContainer = svgContainer.append("g").attr("class", "sm-sensepath-links");
            brushContainer = _container.append("div").attr("class", "sm-sensepath-brush hide");

            addToolbar();
            handleContainerEvents();
            setupZoom();
            addTagInput();
            addTranscriptInput();
            addArrowHeadMarker(svgContainer);
        }

        // Presentation mode
        groupPadding = presentationMode ? 20 : 10;
        groupLabelHeight = presentationMode ? 35: 20;
        iconOnlyWidthPadding = presentationMode ? 56 : 28;
        iconOnlyWidth = presentationMode ? 40 : 20;

        rowHeight = Math.min(height, maxItemHeight + endItemPadding);
        itemHeight = rowHeight - 2 - groupLabelHeight; // 2: border
        minItemTextWidth = iconOnlyWidthPadding * 2;
        maxItemTextWidth = minItemTextWidth * 5;
        minItemWidth = minItemTextWidth;
        maxItemWidth = maxItemTextWidth;
        minUnderstandableWidth = iconOnlyWidthPadding * 2;

        // Data preparation
        if (dataChanged) {
            data = fullData.filter(function(d) { return !d.excluded; });
            linkData = fullLinkData.filter(function(d) { return !d.source.excluded && !d.target.excluded});

            groupItems();
            nonEmbeddedData = data.filter(isSeparate);
            nonEmbeddedDataWithoutRevisits = nonEmbeddedData.filter(function(d) { return !mergeRevisits || type(d) !== 'revisit' || d.orphanRevisit; });
            flattenRevisits();
            initZoom();
            dataChanged = false;
        }

        // Draw
        var groups = groupContainer.selectAll(".sm-sensepath-group").data(groupData, groupKey);
        groups.enter().call(enterGroups);
        groups.call(updateGroups);
        groups.exit().call(exitItems);

        var items = itemContainer.selectAll(".sm-sensepath-item").data(nonEmbeddedDataWithoutRevisits, key);
        items.enter().call(enterItems);
        items.call(updateItems);
        items.exit().call(exitItems);

        // Layout need all images loaded. Periodically check. 'load' event to image isn't working well.
        var id = setInterval(function() {
            var loading = false;
            items.each(function(d) {
                var img = d3.select(this).select("img");
                if (img.attr("src") && img.style("width") === "0px") {
                    loading = true;
                }
            });

            groups.each(function(d) {
                var img = d3.select(this).select("img");
                if (img.attr("src") && img.style("width") === "0px") {
                    loading = true;
                }
            });

            if (!loading) {
                items.each(function(d) {
                    // If image is high, there will be empty space after scaling. Change container's width to remove it.
                    d3.select(this).style("width", (parseInt(d3.select(this).select("img").style("width")) + 2) + "px");
                });

                // Layout
                clearInterval(id);
                computeLayout(items, groups);

                // Transcript
                data.forEach(computeTranscript);

                items.call(updateItemLocations);
                groups.call(updateGroupLocations);

                if (showLinks) {
                    var links = linkContainer.selectAll(".sm-sensepath-link").data(linkData, linkKey);
                    links.enter().call(enterLinks);
                    links.call(updateLinks);
                    links.exit().call(exitItems);
                }
            }
        }, 100); // Testing every 100ms
    }

    function getHost(d) {
        var host = (new URL(url(d))).hostname;
        if (host.substr(0, 4) === "www.") return host.substr(4);
        return host;
    }

    /**
     * Remove hash from the url.
     */
    function getPath(d) {
        var _url = new URL(url(d));
        return _url.origin + _url.pathname;
    }

    /**
     * Builds groups of items.
     */
    function groupItems() {
        groupData = [];
        var currentGroup, parentItem;

        // Always reset. Need it in live capture mode
        data.forEach(function(d) {
            delete d.children;
            d.orphanRevisit = false;
        });

        data.filter(function(d) { return !d.excluded; }).forEach(function(d, i) {
            var host = getHost(d);
            if (!currentGroup || currentGroup.text !== host) { // Create a new group
                if (isSeparate(d)) {
                    var startGroup = true;
                    if (mergeRevisits && type(d) === "revisit") {
                        // Find which node is the one this node revisited, if couldn't find, start a new group
                        for (var j = i - 1; j >= 0; j--) {
                            if (!data[j].excluded && url(data[j]) === url(d)) {
                                // If the node is not separate, use its parent
                                var n = data[j].parent || data[j];
                                n.next = d;
                                d.prev = n;
                                startGroup = false;
                                break;
                            }
                        }
                    }

                    if (startGroup) {
                        currentGroup = { id: key(d), text: host, items: [ d ] };
                        if (icon(d)) currentGroup.icon = icon(d);
                        groupData.push(currentGroup);
                        d.orphanRevisit = true; // To make sure that it's always included as a nonembedded item eventhough it's a revisit
                    }
                    parentItem = d;
                    parentItem.children = null;
                } else {
                    if (!parentItem.children) parentItem.children = [];
                    parentItem.children.push(d);
                    d.parent = parentItem;
                }
            } else {
                if (isSeparate(d)) {
                    // If revisists are merged, don't put it as a separate item, add it as a 'next'/'prev'
                    if (mergeRevisits && type(d) === "revisit") {
                        // Find which node is the one this node revisited, if couldn't find, start a new group
                        for (var j = i - 1; j >= 0; j--) {
                            if (!data[j].excluded && url(data[j]) === url(d)) {
                                // If the node is not separate, use its parent
                                var n = data[j].parent || data[j];
                                n.next = d;
                                d.prev = n;
                                break;
                            }
                        }
                    } else {
                        currentGroup.items.push(d);
                    }

                    parentItem = d;
                } else {
                    if (!parentItem.children) parentItem.children = [];
                    parentItem.children.push(d);
                    d.parent = parentItem;
                }
            }
        });
    }

    // Flatten revisits to make it easier to access all revisits of a node
    function flattenRevisits() {
        var recursiveAdd = function(root, item) {
            root.allRevisits.push(item);
            item.root = root;
            if (item.next) recursiveAdd(root, item.next);
        };

        nonEmbeddedDataWithoutRevisits.forEach(function(d, i) {
            d.allRevisits = [];
            recursiveAdd(d, d);
        });
    }

    function isSeparate(d) {
        return embeddedTypes.indexOf(type(d)) === -1;
    }

    function isSearchType(d) {
        return searchTypes.indexOf(type(d)) !== -1;
    }

    function isRelationshipType(d) {
        return relTypes.indexOf(type(d)) !== -1;
    }

    function isImageView() {
        return view === "image";
    }

    function initZoom() {
        data.forEach(function(d) { d.zoomLevel = defaultZoomLevel; });
    }

    function addArrowHeadMarker(parent) {
        parent.append("defs").append("marker")
            .attr("id", "arrow-marker")
            .attr("viewBox", "-6 -3 6 6")
            .attr("refX", -1)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
                .append("polyline")
                .attr("points", "-4,0 -6,3 0,0 -6,-3");
    }

    function computeLayout() {
        computeLayoutNonEmbeddedItems();
        computeLayoutEmbeddedItems();
        if (showLinks) computeLinkLayout();
    }

    // Recursively get all width of its revisits
    function getMaxWidth(d, parent) {
        parent.totalTime += endTime(d) - time(d);
        if (d.next) {
            getMaxWidth(d.next, parent);
        }
        d.maxWidth = widthScale(parent.totalTime);
    }

    function computeLayoutNonEmbeddedItems() {
        // The longest interval of the entire dataset. Other intervals are scaled with this one.
        var extentTime = d3.extent(nonEmbeddedData.map(function(d) { return endTime(d) - time(d); }));

        // A single item should use the maximum width for better display
        if (extentTime[0] === extentTime[1]) {
            widthScale.domain(extentTime).range([isImageView() ? maxItemWidth : maxItemTextWidth, isImageView() ? maxItemWidth : maxItemTextWidth ]);
        } else {
            widthScale.domain(extentTime).range([isImageView() ? minItemWidth : minItemTextWidth, isImageView() ? maxItemWidth : maxItemTextWidth ]);
        }

        // Item original width is inferred from its DOM element
        nonEmbeddedDataWithoutRevisits.forEach(function(d) {
            if (endTime(d)) {
                if (scaleTime) {
                    // d.totalTime = 0;
                    // getMaxWidth(d, d);

                    d.totalTime = d.allRevisits.map(d => endTime(d) - time(d)).reduce((a, b) => a + b);
                    d.maxWidth = widthScale(d.totalTime);
                } else {
                    d.maxWidth = (isImageView() ? maxItemWidth : maxItemTextWidth) / 3;
                }
            }
        });

        // Reset
        data.forEach(function(d) {
            d.iconOnly = type(d) === "image";
        });

        var offset = 0;
        var level = 0;
        var rowIsUsed = {}; // To indicate if there's somthing in the row to prevent an empty row
        groupData.forEach(function(group) {
            group.x = offset;
            group.y = (textViewGroupHeight + rowPadding) * level;
            group.height = isImageView() ? rowHeight : textViewGroupHeight;
            offset += sideEndItemPadding;

            group.items.forEach(function(d) {
                d.row = level;
                d.x = offset;
                d.y = group.y + endItemPadding + groupLabelHeight;
                d.width = d.maxWidth * d.zoomLevel;
                if (d.width < minUnderstandableWidth) {
                    // Not enough space for the minimal width, don't display any text just the icon to avoid just '...'
                    d.iconOnly = true;
                }

                d.height = isImageView() ? itemHeight : rowTextHeight;
                offset += d.width + itemPadding;
            });

            offset = offset - itemPadding + sideEndItemPadding;
            group.width = offset - group.x;

            // If the group exceeds the container width, move it and its items to the next row
            // Only move if the current is used to prevent an empty row
            if (!isImageView() && offset > width - toolbarWidth && rowIsUsed[level]) {
                level++;
                offset = 0;
                group.x = offset;
                group.y += textViewGroupHeight + rowPadding;
                offset += sideEndItemPadding;

                group.items.forEach(function(d) {
                    d.row = level;
                    d.x = offset;
                    d.y = group.y + endItemPadding + groupLabelHeight;
                    offset += d.width + itemPadding;
                });

                offset = offset - itemPadding + sideEndItemPadding;
            }

            offset += groupPadding * zoomLevel;
            rowIsUsed[level] = 1;
        });
    }

    function computeLayoutEmbeddedItems() {
        // d.children includes all embedded items
        // d.allChildren includes all embedded items of all revisits as well
        var recursiveAdd = function(root, item) {
            if (item.children) item.children.forEach(function(d) {
                d.root = root;
                root.allChildren.push(d);
            });
            if (item.next) recursiveAdd(root, item.next);
        };
        nonEmbeddedDataWithoutRevisits.filter(function(d) { return d.children; }).forEach(function(item) {
            item.allChildren = [];
            recursiveAdd(item, item);
        });

        nonEmbeddedDataWithoutRevisits.filter(function(d) { return d.allChildren && d.allChildren.length; }).forEach(function(item) {
            var level = 1;
            var accumSum = 0;
            var prevParent = item;
            item.allChildren.forEach(function(d, i) {
                if (prevParent !== d.parent) {
                    accumSum += endTime(prevParent) - time(prevParent);
                }
                d.x = (time(d) - time(d.parent) + accumSum) / item.totalTime * item.width;
                d.width = item.width - d.x;
                d.level = level++;
                d.row = item.row;
                prevParent = d.parent;
            });

            // The width of a sub-item is also constrained by the starting position of the next sub-item
            item.allChildren.forEach(function(d, i) {
                // Distance between the current and the next
                var gap = (i === item.allChildren.length - 1 ? item.width : item.allChildren[i + 1].x) - d.x;
                d.width = Math.min(d.width, gap);

                // Not enough space for the minimal width, don't display any text just the icon to avoid just '...'
                if (d.width < minUnderstandableWidth) {
                    d.iconOnly = true;
                }
            });
        });
    }

    function getCentre(d) {
        var x = d.x + d.width / 2;
        var y = d.y + d.height / 2;
        return { x: x, y: y };
    }

    /**
     * Computes control points for links.
     */
    function computeLinkLayout() {
        linkData.forEach(function(d) {
            var source = d.source.root || d.source;
            var target = d.target.root || d.target;
            var s = getCentre(source);
            var t = getCentre(target);
            var yOffset1 = rowTextHeight / 2 + 3;
            var yOffset2 = groupLabelHeight + 1;
            d.points = [];

            // Both ends are on the same row
            if (source.row === target.row) {
                // If they're next to each other, draw a straight line
                if (target.x - source.x - source.width < itemPadding * 2 + groupPadding + 10) {
                    d.points.push({ x: s.x + source.width / 2 - 2, y: s.y });
                    d.points.push({ x: t.x - target.width / 2 - 2, y: s.y });
                } else {
                    // Otherwise, draw upward, then right, then downward
                    d.points.push({ x: s.x, y: s.y - yOffset1 });
                    d.points.push({ x: s.x, y: s.y - yOffset1 - yOffset2 });
                    d.points.push({ x: t.x, y: t.y - yOffset1 - yOffset2 });
                    d.points.push({ x: t.x, y: t.y - yOffset1 });
                }
            } else {
                // Update new s, t to points on the edge
                s.y += yOffset1 - 2;
                t.y -= yOffset1;
                d.points.push(s);
                addPoints(s, t, source.row, target.row, d.points);
                d.points.push({ x: t.x, y: t.y });
            }
        });
    }

    function addPoints(source, target, sourceRow, targetRow, points) {
        var yOffset = groupLabelHeight + 1;

        if (sourceRow === targetRow - 1) {
            points.push({ x: source.x, y: target.y - yOffset });
            points.push({ x: target.x, y: target.y - yOffset });
        } else {
            // Find if there's any obstacle right below
            var obstacle = _.find(data.filter(function(d) { return !d.parent && d.row === sourceRow + 1}), function(d) {
                return d.x <= source.x && source.x <= d.x + d.width;
            });
            var newSource;
            if (obstacle) {
                // Source needs to go around the obstacle right below
                // Go left or right?
                var left = source.x - obstacle < obstacle.width / 2;
                var x = obstacle.x + (left ? 0 : obstacle.width) + itemPadding / 2 * (left ? -1 : 1);
                points.push({ x: source.x, y: obstacle.y - yOffset });
                points.push({ x: x, y: obstacle.y - yOffset });

                newSource = { x: x, y: obstacle.y + obstacle.height };
            } else {
                // Recursive call with new source point
                var anyNextRowItem = data.filter(function(d) { return !d.parent && d.row === sourceRow + 1; })[0];
                if (anyNextRowItem) {
                    newSource = { x: source.x, y: anyNextRowItem.y + anyNextRowItem.height };
                } else {
                    console.log("");
                }
            }

            // Recursive call with new source point
            if (newSource) addPoints(newSource, target, sourceRow + 1, targetRow, points);
        }
    }

    /**
     * Get transcript of a given item.
     */
    function computeTranscript(d) {
        var timePrefix = "[" + module.getOffsetTime(d) + "] ";
        var themePrefix = d.theme ? ("{" + d.theme + "} ") : "";
        var prefix = endTime(d) ? (Math.round((endTime(d) - time(d)) / 1000) + " seconds spent in ") : "";

        var count = 1;
        if (type(d) === "revisit") {
            var currentPos = data.indexOf(d);
            for (var i = 0; i < currentPos; i++) {
                if (type(data[i]) === "revisit" && getPath(d) === getPath(data[i])) count++;
            }
        }

        var atSecond = "";
        if (!isSeparate(d) && d.parent) {
            atSecond = Math.round((time(d) - time(d.parent)) / 1000);
        }

        var t = d.customTranscript;

        if (!t) {
            switch (type(d)) {
                case "search": t = prefix + "searching '" + text(d) + "'"; break;
                case "location": t = prefix + "searching '" + text(d) + "'"; break;
                case "dir": t = prefix + "finding direction '" + text(d) + "'"; break;
                case "link": t = prefix + "browsing '" + text(d) + "'"; break;
                case "type": t = prefix + "browsing '" + text(d) + "'"; break;
                case "bookmark": t = prefix + "browsing '" + text(d) + "'"; break;
                case "revisit": t = prefix + "browsing '" + text(d) + "'"; break;
                case "unknown": t = prefix + "browsing '" + text(d) + "'"; break;

                case "highlight": t = "At second " + atSecond + ", highlighted '" + text(d) + "'"; break;
                case "note": t = "At second " + atSecond + ", took a note '" + text(d) + "'"; break;
                case "image": t = "At second " + atSecond + ", had an interest in an image"; break;
                case "filter": t = "At second " + atSecond + ", " + text(d); break;
                case "read": t = "At second " + atSecond + ", start reading '" + text(d) + "'"; break;
                case "talk": t = "At second " + atSecond + ", start talking '" + text(d) + "'"; break;
            }

            d.customTranscript = t;
        }

        var actionPrefix = actionDisplayNameLookup[type(d)] + (type(d) === "revisit" ? (" " + count + " times") : "");
        d.transcript = timePrefix + "(" + actionPrefix + ") " + themePrefix + "\n" + d.customTranscript;
    };

    function addToolbar() {
        // Filter
        var filterbarContainer = _container.append("div").attr("class", "sm-sensepath-filterbar");
        filterbarContainer.append("output").node().value = "≥" + minTimeFilter + "s";
        filterbarContainer.append("input")
            .attr("type", "range")
            .attr("min", 1)
            .attr("max", 25)
            .attr("step", 1)
            .attr("value", minTimeFilter)
            .on("input", function() {
                minTimeFilter = this.value;
                d3.select(this.parentNode).select("output").node().value = "≥" + this.value + "s";
                blurWillBeRemovedItems();
            }).on("change", function() {
                dataChanged = true;
                update();
            });

        // Image view
        var imageViewContainer = _container.append("div").attr("class", "sm-sensepath-fisheye");
        imageViewContainer.append("button").attr("class", "btn btn-default glyphicon glyphicon-font")
            .attr("title", "Switch to " + (isImageView() ? "text view" : "image view"))
            .on("click", function() {
                view = view === "text" ? "image" : "text";
                d3.select(this).attr("title", "Switch to " + (isImageView() ? "text view" : "image view"))
                    .classed("glyphicon-picture", isImageView())
                    .classed("glyphicon-font", !isImageView());
                update();
            });

        // Zoom
        var toolbarContainer = _container.append("div").attr("class", "sm-sensepath-toolbar btn-group-vertical");
        toolbarContainer.append("button").attr("class", "btn btn-default glyphicon glyphicon-plus")
            .attr("title", "Zoom In")
            .on("click", function() {
                setNewZoom(true);
            });
        toolbarContainer.append("button").attr("class", "btn btn-default glyphicon glyphicon-minus")
            .attr("title", "Zoom Out")
            .on("click", function() {
                setNewZoom(false);
            });
        toolbarContainer.append("button").attr("class", "btn btn-default glyphicon glyphicon-refresh")
            .attr("title", "Reset Zoom")
            .on("click", function() {
                setNewZoom(true, true);
            });
        toolbarWidth = toolbarContainer.node().getBoundingClientRect().width + 5;
    }

    function handleContainerEvents() {
        d3.select(_container.node().parentNode).on("click", function() {
            // If click on other elements and propagates to the container
            if (d3.event.target !== this) return;

            hideTagInput();
            hideTranscriptInput();

            if (brushing) {
                brushing = false;
                return;
            }

            // Deselect all
            itemContainer.selectAll(".sm-sensepath-item").each(function(d) {
                d.selected = false;
                d3.select(this).classed("selected", false);
            });
        });
    }

    function setupZoom() {
        // Scroll by wheeling and panning
        var leftMouseDown = false;
        var prevX, prevY, initX, initY;
        $(parent.node()).on("wheel", function(e) {
            if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
                // Zoom
                setNewZoom(e.originalEvent.wheelDelta > 0);
            } else {
                // Scroll by wheeling
                if (isImageView()) { // In image view, only one row, scroll left-right
                    this.scrollLeft -= e.originalEvent.wheelDelta;
                } else { // Scroll up-down, one scroll = one row
                    this.scrollTop -= e.originalEvent.wheelDelta / Math.abs(e.originalEvent.wheelDelta) * (textViewGroupHeight + rowPadding);
                }
                e.preventDefault();
            }
        }).on("mousedown", function(e) {
            if (e.which !== 1) return;
            if (e.clientX > width - toolbarWidth) return; // toolbar area
            if (transcriptInputContainer.node().contains(e.target) || tagInputContainer.node().contains(e.target)) return;

            leftMouseDown = true;
            prevX = e.clientX;
            prevY = e.clientY;

            if (e.ctrlKey) return;

            // Hold mouse down for 0.1s to start brushing
            timeoutId = setTimeout(function() {
                brushing = true;
                initX = e.clientX;
                initY = e.clientY;
                brushContainer.style("width", "0px").style("height", "0px");
                parent.classed("crosshair", brushing);
                brushContainer.classed("hide", !brushing);
            }, 100);
        }).on("mouseup", function() {
            leftMouseDown = false;

            if (brushing) {
                dispatch.itemsSelected(data.filter(function(d) { return d.selected || d.parent && d.parent.selected; }).sort(function(a, b) { return d3.ascending(+time(a), +time(b))}));
            }

            parent.classed("crosshair", false);
            brushContainer.classed("hide", true);
            clearTimeout(timeoutId);
        }).on("mousemove", function(e) {
            if (!leftMouseDown) return;
            if (e.clientX > width - toolbarWidth) return; // toolbar area

            if (brushing) { // Brush
                // Draw
                brushContainer.style("left", Math.min(initX + this.scrollLeft, e.clientX + this.scrollLeft) + "px").style("top", Math.min(initY + this.scrollTop, e.clientY + this.scrollTop) + "px")
                    .style("width", Math.abs(e.clientX - initX) + "px").style("height", Math.abs(e.clientY - initY) + "px");

                // Set selected if items intersect with the brush
                itemContainer.selectAll(".sm-sensepath-item").each(function(d) {
                    // If hold CTRL, add to the current selection
                    // Otherwise, create a new selection set
                    if (e.ctrlKey) {
                        if (this.intersect(brushContainer.node())) {
                            d.selected = true;
                        }
                    } else {
                        d.selected = this.intersect(brushContainer.node());
                    }
                    d3.select(this).classed("selected", d.selected);
                });
            } else if (e.ctrlKey) { // Pan
                this.scrollLeft -= e.clientX - prevX;
                this.scrollTop -= e.clientY - prevY;
                prevX = e.clientX;
                prevY = e.clientY;
                e.preventDefault();
            }
        });

        // Zoom
        $(document).on("keydown", function(e) {
            // Escape key to hide all popup controls
            if (e.keyCode === 27) {
                hideMenu();
                hideTagInput();
                hideTranscriptInput();
                deselectAll();
            }

            if (!e.metaKey && !e.ctrlKey || e.keyCode !== 187 && e.keyCode !== 189 && e.keyCode !== 86) return;

            if (e.keyCode === 86) { // Ctrl + V
                view = view === "text" ? "image" : "text";
                update();
            } else {
                setNewZoom(e.keyCode === 187);
            }

            e.preventDefault();
        });
    }

    function setNewZoom(zoomIn, reset) {
        // If any items are selected, apply zoom to those; otherwise, apply to all
        var selectedSet = nonEmbeddedDataWithoutRevisits.filter(function(d) { return d.selected; });
        if (!selectedSet.length) selectedSet = nonEmbeddedDataWithoutRevisits;

        selectedSet.forEach(function(d) { d.zoomLevel = reset ? defaultZoomLevel : zoomIn ? Math.min(maxZoomLevel, d.zoomLevel + zoomStep) : Math.max(minZoomLevel, d.zoomLevel - zoomStep); });
        update();
    }

    function blurWillBeRemovedItems() {
        // Item
        fullData.forEach(function(d) {
            d.excluded = endTime(d) && endTime(d) - time(d) < minTimeFilter * 1000;
            if (d.children) {
                d.children.forEach(function(d2) { d2.excluded = d.excluded; });
            }
        });
        itemContainer.selectAll(".sm-sensepath-item").each(function(d) {
            d3.select(this).classed("excluded", d.excluded);
        });

        // Group
        groupContainer.selectAll(".sm-sensepath-group").each(function(group) {
            var allExcluded = group.items.every(function(d) { return d.excluded; });
            d3.select(this).classed("excluded", allExcluded);
        });
    }

    function addTagInput() {
        tagInputContainer = _container.append("div").attr("class", "sm-sensepath-tag form-inline hide");
        tagInputContainer.append("input").attr("class", "form-control").attr("type", "text")
            .on("keydown", function () {
                if (d3.event.keyCode === 13) {
                    // Remember if this is a new theme
                    if (!tagList[this.value]) {
                        tagList[this.value] = 1;
                    }

                    // Save theme to data
                    activeItem.theme = this.value;
                    computeTranscript(activeItem);
                    d3.select(activeItem.ref).attr("title", activeItem.transcript);

                    hideTagInput();
                }
            });
        tagInputContainer.append("select").attr("class", "form-control")
            .on("change", function() {
                // Save theme to data
                activeItem.theme = this.value;
                computeTranscript(activeItem);
                d3.select(activeItem.ref).attr("title", activeItem.transcript);

                hideTagInput();
            });
    }

    function showTagInput(d) {
        activeItem = d;

        // Add all options to the menu
        var select = tagInputContainer.select("select");
        select.selectAll("option").remove();
        d3.keys(tagList).sort().forEach(function(value) {
            select.append("option").text(value);
        });

        // Load existing value
        $(select.node()).val(d.theme);

        // Show control
        tagInputContainer.classed("hide", false);
        tagInputContainer.style("left", d3.event.x - tagInputContainer.node().getBoundingClientRect().width / 2 + "px").style("top", d3.event.y + "px");
        $(tagInputContainer.select("input").node()).val(d.theme).focus();
    }

    function hideTagInput() {
        tagInputContainer.classed("hide", true);
    }

    function addTranscriptInput() {
        transcriptInputContainer = _container.append("div").attr("class", "sm-sensepath-transcript hide");
        transcriptInputContainer.append("textarea").attr("class", "form-control").attr("rows", 4)
            .on("keydown", function () {
                if (d3.event.keyCode === 13) {
                    // Save transcript to data
                    activeItem.customTranscript = this.value;
                    computeTranscript(activeItem);
                    d3.select(activeItem.ref).attr("title", activeItem.transcript);

                    hideTranscriptInput();
                }
            });
    }

    function showTranscriptInput(d) {
        activeItem = d;

        // Load existing value
        var textarea = transcriptInputContainer.select("textarea");
        $(textarea.node()).val(d.customTranscript);

        // Show control
        transcriptInputContainer.classed("hide", false);
        transcriptInputContainer.style("left", d3.event.x - transcriptInputContainer.node().getBoundingClientRect().width / 2 + "px").style("top", d3.event.y + "px");
        $(textarea.node()).focus();
    }

    function hideTranscriptInput() {
        transcriptInputContainer.classed("hide", true);
    }

    function deselectAll() {
        itemContainer.selectAll(".sm-sensepath-item").each(function(d) {
            d.selected = false;
            d3.select(this).classed("selected", d.selected);
        });
    }

    /**
     * Called when new items added.
     */
    function enterItems(selection) {
        var container = selection.append("div").attr("class", "sm-sensepath-item")
            .style("left", "0px")
            .style("top", "0px")
            .style("opacity", 0)
            .each(function(d) { d.ref = this; })
            .on("mouseover", function(d) {
                // Brush other items having the same page as the hovering one
                itemContainer.selectAll(".sm-sensepath-item").each(function(d2) {
                    var brushed = d2 !== d && url(d2) === url(d);
                    d3.select(this).classed("brushed", brushed);

                    var linked = type(d) === "link" && key(d2) === d.from && d !== d2;
                    d3.select(this).classed("linked", linked);
                });

                if (d3.event.ctrlKey) return; // When panning, no need to show menu
                showMenu(d);
            }).on("mouseout", function(d) {
                // Brush
                itemContainer.selectAll(".sm-sensepath-item").each(function(d2) {
                    d3.select(this).classed("brushed linked", false);
                });

                hideMenu();
            }).on("click", handleItemClick);

        // Image
        container.append("img").attr("class", "img-responsive");

        // Text
        var bottom = container.append("div").attr("class", "sm-sensepath-item-bottom");
        bottom.append("div").attr("class", "sm-sensepath-item-text");

        // Icon
        bottom.append("div").attr("class", "sm-sensepath-item-icon glyphicon fa")
            .classed('fa-2x', presentationMode)
            .each(function(d) { d3.select(this).classed(iconClassLookup[type(d)], true); });

        // Menu action
        var buttons = container.append("div").attr("class", "btn-group btn-group-xs sm-sensepath-item-buttons hide");
        buttons.append("button").attr("class", "btn btn-default glyphicon glyphicon-pencil")
            .attr("title", "Edit transcript")
            .on("click", function(d) {
                showTranscriptInput(d);
                d3.event.stopPropagation();
            });
        buttons.append("button").attr("class", "btn btn-default glyphicon glyphicon-tag")
            .attr("title", "Assign theme")
            .on("click", function(d) {
                showTagInput(d);
                d3.event.stopPropagation();
            });
        buttons.append("button").attr("class", "btn btn-default glyphicon glyphicon-remove")
            .attr("title", "Remove this action")
            .on("click", function(d) {
                fullData.splice(fullData.indexOf(d), 1);
                dataChanged = true;
                update();
                d3.event.stopPropagation();
            });
    }

    function showMenu(d) {
        d3.select(d.ref).select(".btn-group").classed("hide", false).transition().style("opacity", 1);
    }

    function hideMenu() {
        itemContainer.selectAll(".sm-sensepath-item, .sm-sensepath-sub-item").select(".btn-group").classed("hide", true).transition().style("opacity", 0);
    }

    /**
     * Called when items updated.
     */
    function updateItems(selection) {
        selection.each(function(d) {
            var container = d3.select(this);

            // Status
            container.classed("brushed", d.brushed);

            // Type
            container.select(".sm-sensepath-item-icon")
                .style("background-color", isSearchType(d) ? colorScale(type(d)) : "#fff")
                .style("border", isSearchType(d) ? "1px solid black" : "none")
                .classed(iconClassLookup[type(d)], true);
            container.select(".sm-sensepath-item-text").classed("text-view", !isImageView());

            // Image
            // container.select("img").attr("src", image(d));

            // Text
            container.select(".sm-sensepath-item-text").text(text);

            // Compute num rows here so that the layout can use
            if (!rowTextHeight) {
                rowTextHeight = Math.round(container.select(".sm-sensepath-item-text").node().getBoundingClientRect().height);
                textViewGroupHeight = groupLabelHeight + rowTextHeight + endItemPadding * (presentationMode ? 4 : 2);
            }
        });
    }

    /**
     * Updates item locations. Separately from 'updateItems' because layout depends on item sizes.
     */
    function updateItemLocations(selection) {
        selection.each(function(d) {
            var container = d3.select(this);

            // Show/hide according to view, should be done here after the layout is computed
            container.select("img").classed("hide", !isImageView());

            // Tooltip
            container.attr("title", d.transcript);

            // Trim text of title in text view when it has actions
            // container.select(".sm-sensepath-item-text").classed("hide", !isImageView() && isSeparate(d) && d.children || d.iconOnly);
            // Don't simply hide page's title when it has children. Trim it right before the first child appears.
            container.select(".sm-sensepath-item-text").classed("hide", d.iconOnly);

            // If width doesn't represent time, makes its length no bigger than its text (unecessary void space)
            // HOW?
            container.transition().duration(duration)
                .style("opacity", 1)
                .style("left", Math.round(d.x) + "px")
                .style("top", Math.round(d.y) + "px")
                .style("width", Math.round(d.width) + "px")
                .style("height", Math.round(d.height + 2) + "px")
                .select("img").style("height", Math.round(d.height) + 0.5 + "px");

            if (d.children) {
                updateSubItems(container, d);
                container.select(".sm-sensepath-item-text")
                    .style('max-width', d.children[0].x + "px")
            }

            // Background shows revisits
            var stops = ['90deg'];
            var spans = d.allRevisits.map(function(d) { return endTime(d) - time(d); });
            var whiteFirst = true;
            var accumSum = 0;
            spans.pop();
            spans.forEach(function(s) {
                accumSum += s;
                var percent = accumSum / d.totalTime * 100;
                stops.push((whiteFirst ? '#ffffff ' : '#ccc ') + percent + '%');
                stops.push((whiteFirst ? '#ccc ' : '#ffffff ') + percent + '%');
                whiteFirst = !whiteFirst;
            });

            container.style('background', 'linear-gradient(' + stops.join(', ') + ')');
        });
    }

    function updateSubItems(container, d) {
        // Enter
        var subItems = container.selectAll(".sm-sensepath-sub-item").data(d.allChildren, key);
        var enterItems = subItems.enter().append("div").attr("class", "sm-sensepath-sub-item")
            .style("opacity", 0)
            .each(function(d) { d.ref = this; });

        enterItems.append("div").attr("class", "sm-sensepath-sub-item-text");
        enterItems.append("div").attr("class", "sm-sensepath-item-icon glyphicon fa").classed('fa-2x', presentationMode)
            .on("mouseover", function(d2) {
                if (d3.event.ctrlKey) return; // When panning, no need to show menu
                showMenu(d2);
                d3.event.stopPropagation();
            }).on("mouseout", function() {
                hideMenu();
            }).on("click", handleItemClick);
        enterItems.each(function(d2) { d3.select(this).classed(type(d2), true); });

        // Menu action
        var buttons = enterItems.select(".sm-sensepath-item-icon").append("div").attr("class", "btn-group btn-group-xs sm-sensepath-item-buttons hide");
        buttons.append("button").attr("class", "btn btn-default glyphicon glyphicon-pencil")
            .attr("title", "Edit transcript")
            .on("click", function(d) {
                showTranscriptInput(d);
                d3.event.stopPropagation();
            });
        buttons.append("button").attr("class", "btn btn-default glyphicon glyphicon-tag")
            .attr("title", "Assign theme")
            .on("click", function(d) {
                showTagInput(d);
                d3.event.stopPropagation();
            });
        buttons.append("button").attr("class", "btn btn-default glyphicon glyphicon-remove")
            .attr("title", "Remove this action")
            .on("click", function(d) {
                fullData.splice(fullData.indexOf(d), 1);
                dataChanged = true;
                update();
                d3.event.stopPropagation();
            });

        // Update
        subItems.select(".sm-sensepath-item-icon").attr("title", function(d2) { return d2.transcript; });
        subItems.select(".sm-sensepath-sub-item-text")
            .text(text)
            .each(function(d2) { d3.select(this).classed("hide", d2.iconOnly).classed("text-view", !isImageView()); });
        subItems.select(".sm-sensepath-item-icon")
            .each(function(d2) {
                d3.select(this).style("background-color", colorScale(type(d2)))
                    .classed(iconClassLookup[type(d2)], true);
            });

        if (!scaleTime) {
            subItems.each(function(d2, i) {
                d2.x = d.width / (d.allChildren.length + 1) * (i + 1);
                d2.width = d.width / (d.allChildren.length + 1) + 2;
            });
        }

        subItems.transition().duration(duration).style("opacity", 1)
            .style("left", function(d2) { return Math.round(d2.x) + "px"; })
            .style("bottom", function(d2) {
                return (isImageView() ? 1 : 0) * (rowTextHeight + 1) + "px";
            }).style("max-width", function(d2) { return Math.floor(d2.width - 1) + "px"; }); // -1: Give 1px gap to easily distinguish

        // Exit
        subItems.exit().transition().duration(duration).style("opacity", 0).remove();
    }

    function handleItemClick(d) {
        if (d3.event.ctrlKey) return;

        dispatch.itemClicked(d);
        d3.event.stopPropagation();
    }

    /**
     * Called when items removed.
     */
    function exitItems(selection) {
        selection.each(function(d) {
            d3.select(this).transition().duration(duration)
                .style("opacity", 0)
                .remove();
        });
    }

    /**
     * Called when new groups added.
     */
    function enterGroups(selection) {
        var container = selection.append("div").attr("class", "sm-sensepath-group")
            .style("opacity", 0);

        // Label
        var c = container.append("div").attr("class", "sm-sensepath-group-label");
        c.append("img");
        c.append("div");
    }

    /**
     * Called when new groups updated.
     */
    function updateGroups(selection) {
        selection.each(function(d) {
            var container = d3.select(this);

            // Icon
            container.select(".sm-sensepath-group-label img")
                .attr("src", d.icon)
                .classed("hide", !d.icon);

            // Label
            container.select(".sm-sensepath-group-label div")
                .text(d.text)
                .attr("title", d.text);
        });
    }

    /**
     * Updates group locations.
     */
    function updateGroupLocations(selection) {
        selection.each(function(d) {
            var container = d3.select(this);
            container.transition().duration(duration)
                .style("opacity", 1)
                .style("left", Math.round(d.x) + "px")
                .style("top", Math.round(d.y) + "px")
                .style("width", Math.round(d.width) + "px")
                .style("height", Math.round(d.height) + "px");

            // Icon alignment
            var img = container.select(".sm-sensepath-group-label img").node().getBoundingClientRect();
            var top = (groupLabelHeight - img.height) / 2 + 3;
            container.select(".sm-sensepath-group-label img")
                .style("top", top + "px");

            // Label
            container.select(".sm-sensepath-group-label div")
                .style("padding-left", img.width + 2 + "px")
                .style("max-width", Math.round(d.width - 16) + "px"); // For inline-block diplay working
        });
    }

    /**
     * Does stuff when new links added (usually called when 'enter').
     */
    function enterLinks(selection) {
        var container = selection.append("g").attr("class", "sm-sensepath-link")
            .attr("opacity", 0);

        container.append("path")
            .attr("class", "line")
            .attr('marker-end', 'url(#arrow-marker)');
    }

    /**
     * Does stuff when link updated (usually called when 'update').
     */
    function updateLinks(selection) {
        var maxY = 0;

        selection.each(function(d) {
            var container = d3.select(this).transition()
                .attr("opacity", 1);

            d.points.forEach(function(d2) {
                maxY = Math.max(maxY, d2.y);
            });

            container.select(".line").attr("d", line(d.points));
        });

        // SVG's height should cover all links to make sure it's visible
        svgContainer.attr('height', maxY + 10 + 'px');
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
     * Sets/gets the recording time as offset.
     */
    module.startRecordingTime = function(value) {
        if (!arguments.length) return startRecordingTime;
        startRecordingTime = value;
        return this;
    };

    /**
     * Sets/gets whether data has been changed.
     */
    module.dataChanged = function(value) {
        if (!arguments.length) return dataChanged;
        dataChanged = value;
        return this;
    };

    /**
     * Sets/gets whether item width scales with time.
     */
    module.scaleTime = function(value) {
        if (!arguments.length) return scaleTime;
        scaleTime = value;
        return this;
    };

    /**
     * Sets/gets whether the vis should displayed in presentation mode.
     */
    module.presentationMode = function(value) {
        if (!arguments.length) return presentationMode;
        presentationMode = value;
        return this;
    };

    /**
     * Remove generated attributes.
     */
    module.cleanData = function(d) {
        delete d.ref;
        delete d.x;
        delete d.y;
        delete d.width;
        delete d.height;
        delete d.maxWidth;
        delete d.children;
        delete d.parent;
        delete d.iconOnly;
        delete d.selected;
        delete d.excluded;
        delete d.transcript;
        delete d.customTranscript;
        delete d.zoomLevel;
        delete d.allChildren;
        delete d.allRevisits;
        delete d.orphanRevisit;
        delete d.root;
        delete d.row;
    };

    /**
     * Get relative time to starting recording time.
     */
    module.getOffsetTime = function(d) {
        var t = hourFormat(new Date(time(d) - startRecordingTime));
        if (endTime(d)) {
            t += " - " + hourFormat(new Date(endTime(d) - startRecordingTime));
        }

        return t;
    }

    /**
     * Brush status changed, update the visualization.
     */
    module.updateBrush = function(indices) {
        for (var i = 0; i < fullData.length; i++) {
            fullData[i].brushed = indices.indexOf(i) !== -1;
        }
        data.forEach(function(d) {
            d3.select(d.ref).classed("brushed", d.brushed);
        });
    };

    // Binds custom events
    d3.rebind(module, dispatch, "on");

    return module;
};