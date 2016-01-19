/**
 * table module displays a simple table of item, and fires an event when an item is selected.
 * quick and dirty: it's currently used for showing transcript in SensePath project.
 */
sm.vis.table = function() {
    // DOM
    var _container, // div element containing the entire visualization
        tbody;

    var value1 = function(d) { return d.value1; },
        value2 = function(d) { return d.value2; },
        value3 = function(d) { return d.value3; },
        value4 = function(d) { return d.value4; },
        value5 = function(d) { return d.value5; },
        type = function(d) { return d.type; };

    // Key function to bind data
    var key = function(d) {
        return d.id;
    };

    var maxWidth, maxHeight;

    var colorScale = d3.scale.category10()
            .domain([ "search", "location", "dir", "highlight", "note", "image", "filter", "read", "talk" ])
            .range([ "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf" ]);

    var dispatch = d3.dispatch("itemSelected");

    /**
     * Main entry of the module.
     */
    function module(selection) {
        selection.each(function(data) {
            // Initialize
            if (!_container) {
                _container = d3.select(this).append("div").attr("class", "sm-table");
                var table = _container.append("table").attr("class", "table table-bordered table-condensed table-hover table-striped");
                var thead = table.append("thead").append("tr");
                thead.append("th").text("Start time");
                thead.append("th").text("End time");
                thead.append("th").text("Action");
                thead.append("th").text("Theme");
                thead.append("th").text("Description");
                tbody = table.append("tbody");
                if (maxWidth) tbody.style("max-width", maxWidth + "px");
                if (maxHeight) tbody.style("max-height", maxHeight + "px");
            }

            // Enter - Update - Exit
            var items = tbody.selectAll("tr").data(data, key);
            items.enter().call(enterItems);
            items.call(updateItems);
            items.exit().remove();
        });
    }

    /**
     * Does stuff when new items added (usually called when 'enter').
     */
    function enterItems(selection) {
        var row = selection.append("tr")
            .attr("class", "sm-table-row")
            .on("click", function(d) {
                tbody.selectAll(".sm-table-row").each(function(d2) {
                    d2.selected = true;
                    d3.select(this).classed("selected", false);
                });

                d.selected = true;
                d3.select(this).classed("selected", true);
                dispatch.itemSelected(d);
            });

        row.append("td");
        row.append("td");
        row.append("td");
        row.append("td");
        row.append("td");
    }

    /**
     * Does stuff when items updated (usually called when 'update').
     */
    function updateItems(selection) {
        selection.each(function(d) {
            var container = d3.select(this)
                .classed("selected", d.selected)
                .style("background-color", colorScale.domain().indexOf(type(d)) !== -1 ? colorScale(type(d)) : "none")
                .style("color", colorScale.domain().indexOf(type(d)) !== -1 ? "white" : "black");

            container.select("td:nth-child(1)").text(value1(d));
            container.select("td:nth-child(2)").text(value2(d));
            container.select("td:nth-child(3)").text(value3(d));
            container.select("td:nth-child(4)").text(value4(d));
            container.select("td:nth-child(5)").text(value5(d));
        });

        // Make header same width as rows (it should be done in css?)
        var widths = [];
        tbody.select("tr").selectAll("td").each(function(d, i) {
            widths.push(this.getBoundingClientRect().width);
        });

        _container.select("thead").selectAll("th").each(function(d, i) {
            d3.select(this).style("width", widths[i] + "px");
        });
    }

    /**
     * Sets/gets the key function to bind data.
     */
    module.key = function(value) {
        if (!arguments.length) return key;
        key = value;
        return this;
    };

    /**
     * Set max-width of table body for scrolling.
     */
    module.maxWidth = function(value) {
        maxWidth = value;
        if (tbody && maxWidth) tbody.style("max-width", maxWidth + "px");
        return this;
    }

    /**
     * Set max-height of table body for scrolling.
     */
    module.maxHeight = function(value) {
        maxHeight = value;
        if (tbody && maxHeight) tbody.style("max-height", maxHeight + "px");
        return this;
    }

    /**
     * Update selected style.
     */
    module.updateSelected = function() {
        tbody.selectAll(".sm-table-row").each(function(d) {
            d3.select(this).classed("selected", d.selected);
        });
    }

    // Binds custom events
    d3.rebind(module, dispatch, "on");

    return module;
};