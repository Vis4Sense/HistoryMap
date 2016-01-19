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
        absoluteScale = false,
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
        groupKey = function(d) { return d.id; }; // Uniquely bind group to element

    // DOM
    var _container, // Contain the entire visualization
        parent, // The input container (parent of _container)
        svgContainer,
        groupContainer,
        itemContainer,
        tagInputContainer,
        transcriptInputContainer,
        brushContainer;

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
        defaultZoomLevel = 2,
        zoomStep = 0.3,
        minZoomLevel = 0.25,
        maxZoomLevel = 10,
        minTimeFilter = 1, // Filtered out all items that have browsing time less than this value
        duration = 500,
        fisheye = false,
        showSourceIcon = false,
        brush;

    // Data
    var fullData, data, nonEmbeddedData,
        groupData,
        activeItem, // The item that being clicked, used for assigning theme
        dataChanged = true; // To distinguish the changes that need to recompute data;

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
            fullData = _data;
            parent = d3.select(this);
            update(this);
        });
    }

    function update(self) {
        // Initialize
        if (!_container) {
            _container = parent.append("div").attr("class", "sm-sensepath");
            svgContainer = _container.append("svg").attr("class", "sm-sensepath-svg hide");
            groupContainer = _container.append("div").attr("class", "sm-sensepath-groups");
            itemContainer = _container.append("div").attr("class", "sm-sensepath-items");
            brushContainer = _container.append("div").attr("class", "sm-sensepath-brush hide");

            addToolbar();
            handleContainerEvents();
            setupZoom();
            addTagInput();
            addTranscriptInput();
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
            groupItems();
            nonEmbeddedData = data.filter(isSeparate);
            initZoom();
            dataChanged = false;
        }

        // Draw
        var groups = groupContainer.selectAll(".sm-sensepath-group").data(groupData, groupKey);
        groups.enter().call(enterGroups);
        groups.call(updateGroups);
        groups.exit().call(exitItems);

        var items = itemContainer.selectAll(".sm-sensepath-item").data(nonEmbeddedData, key);
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
     * Builds groups of items
     */
    function groupItems() {
        groupData = [];
        var currentGroup, parentItem;

        // Always reset. Need it in live capture mode
        data.forEach(function(d) { delete d.children; });

        data.filter(function(d) { return !d.excluded; }).forEach(function(d, i) {
            var host = getHost(d);
            if (!currentGroup || currentGroup.text !== host) { // Create a new group
                if (isSeparate(d)) {
                    currentGroup = { id: key(d), text: host, items: [ d ] };
                    groupData.push(currentGroup);
                    parentItem = d;
                    parentItem.children = null;
                }
            } else {
                if (isSeparate(d)) {
                    currentGroup.items.push(d);
                    if (isSeparate(d)) {
                        parentItem = d;
                    }
                } else {
                    if (!parentItem.children) parentItem.children = [];
                    parentItem.children.push(d);
                }
            }

            if (icon(d)) currentGroup.icon = icon(d);
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

    function computeLayout() {
        computeLayoutNonEmbeddedItems();
        computeLayoutEmbeddedItems();
    }

    function computeLayoutNonEmbeddedItems() {
        // The longest interval of the entire dataset. Other intervals are scaled with this one.
        var extentTime = d3.extent(nonEmbeddedData.map(function(d) { return endTime(d) - time(d); }));

        if (absoluteScale) {
            widthScale.domain([0, extentTime[1]]).range([1, isImageView() ? maxItemWidth : maxItemTextWidth ]);
        } else {
            // A single item should use the maximum width for better display
            if (extentTime[0] === extentTime[1]) {
                widthScale.domain(extentTime).range([isImageView() ? maxItemWidth : maxItemTextWidth, isImageView() ? maxItemWidth : maxItemTextWidth ]);
            } else {
                widthScale.domain(extentTime).range([isImageView() ? minItemWidth : minItemTextWidth, isImageView() ? maxItemWidth : maxItemTextWidth ]);
            }
        }

        // Item original width is inferred from its DOM element
        itemContainer.selectAll(".sm-sensepath-item").each(function(d) {
            if (endTime(d)) {
                if (scaleTime) {
                    d.maxWidth = widthScale(endTime(d) - time(d));
                    if (absoluteScale) {
                        d.maxWidth = Math.max(iconOnlyWidthPadding, d.maxWidth);
                    }
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
                d.x = offset;
                d.y = group.y + endItemPadding + groupLabelHeight;
                d.width = d.maxWidth * d.zoomLevel;
                if (d.width < minUnderstandableWidth) {
                    // Not enough space for the minimal width, don't display any text just the icon to avoid just '...'
                    d.iconOnly = true;
                }

                d.height = isImageView() || d.fisheye ? itemHeight : rowTextHeight;
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
        nonEmbeddedData.filter(function(d) { return d.children; }).forEach(function(item) {
            var level = 1;
            var length = endTime(item) - time(item);
            item.children.forEach(function(d, i) {
                d.x = (time(d) - time(item)) / length * item.width;
                d.width = item.width - d.x;
                d.level = level++;
                d.parent = item;
            });

            // The width of a sub-item is also constrained by the starting position of the next sub-item
            item.children.forEach(function(d, i) {
                // Distance between the current and the next
                var gap = (i === item.children.length - 1 ? item.width : item.children[i + 1].x) - d.x;
                d.width = Math.min(d.width, gap);

                // Not enough space for the minimal width, don't display any text just the icon to avoid just '...'
                if (d.width < minUnderstandableWidth) {
                    d.iconOnly = true;
                }
            });
        });
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

            if (e.ctrlKey || fisheye) return;

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
            if (!leftMouseDown && !fisheye) return;
            if (e.clientX > width - toolbarWidth) return; // toolbar area

            if (fisheye) {
                // Change the hovering item to image view
                var changed = false;
                itemContainer.selectAll(".sm-sensepath-item").each(function(d) {
                    var newFisheye = this.containsPoint({ x: e.clientX, y: e.clientY });
                    if (d.fisheye !== newFisheye) {
                        d.fisheye = newFisheye;
                        changed = true;

                        d3.select(this).style("z-index", d.fisheye ? 5 : 0);
                    }
                });
                if (changed) update();
            } else if (brushing) { // Brush
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
        var selectedSet = nonEmbeddedData.filter(function(d) { return d.selected; });
        if (!selectedSet.length) selectedSet = nonEmbeddedData;

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
        bottom.append("div").attr("class", "sm-sensepath-item-text")
            .each(function(d) { d3.select(this).classed("extra-source", showSourceIcon && isRelationshipType(d)); });

        // Icon
        bottom.append("div").attr("class", "sm-sensepath-item-icon glyphicon fa")
            .classed('fa-2x', presentationMode)
            .each(function(d) { d3.select(this).classed(iconClassLookup[type(d)], true); });

        if (showSourceIcon) {
            bottom.each(function(d) {
                if (isRelationshipType(d)) {
                    var extraIcon = d3.select(this).append("div").attr("class", "sm-sensepath-item-icon extra-source glyphicon fa");

                    // Find which icon to show
                    if (type(d) === "link") {
                        for (var i = 0; i < fullData.length; i++) {
                            if (key(fullData[i]) === d.from && fullData[i] !== d) {
                                extraIcon.classed(iconClassLookup[type(fullData[i])], true);
                                break;
                            }
                        }
                    } else if (type(d) === "revisit") {
                        for (var i = 0; i < fullData.length; i++) {
                            if (url(fullData[i]) === url(d) && fullData[i] !== d) {
                                extraIcon.classed(iconClassLookup[type(fullData[i])], true);
                                break;
                            }
                        }
                    }
                }
            });
        }

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
            container.select(".sm-sensepath-item-text").classed("text-view", !isImageView() && !d.fisheye);

            // Image
            container.select("img").attr("src", image(d));

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
            container.select("img").classed("hide", !isImageView() && !d.fisheye);

            // Tooltip
            container.attr("title", d.transcript);

            // Trim text of title in text view when it has actions
            // container.select(".sm-sensepath-item-text").classed("hide", !isImageView() && !d.fisheye && isSeparate(d) && d.children || d.iconOnly);
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
        });
    }

    function updateSubItems(container, d) {
        // Enter
        var subItems = container.selectAll(".sm-sensepath-sub-item").data(d.children, key);
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
                d2.x = d.width / (d.children.length + 1) * (i + 1);
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
        delete d.fisheye;
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