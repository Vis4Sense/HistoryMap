/**
 * Adds zoom/pan to the given SVG node.
 */
sm.zoom = function(container) {
    // Add invisible rectangle covering the entire space to listen to mouse event.
    // Otherwise, only zoom when mouse-overing visible items.
    var parent = d3.select(container.node().parentNode);
    parent.insert("rect", ":first-child")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("fill", "none")
        .style("pointer-events", "all");

    var zoom = d3.behavior.zoom().on("zoom", function() {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    });
    parent.call(zoom).on("dblclick.zoom", null);
};

/**
 * Adds mouse wheel to pan to the given SVG node.
 */
sm.wheelPan = function(container) {
    // Add invisible rectangle covering the entire space to listen to mouse event.
    // Otherwise, only zoom when mouse-overing visible items.
    var parent = d3.select(container.node().parentNode);
    parent.insert("rect", ":first-child")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("fill", "none")
        .style("pointer-events", "all");

    parent.on('wheel', function() {
        var t = d3.transform(container.attr("transform"));
        t.translate[0] = Math.min(0, t.translate[0] + d3.event.wheelDelta); // Only move to the right side
        container.attr("transform", "translate(" + t.translate + ")");
    });
};

/**
 * Adds key arrow to pan to the given SVG node.
 * Adds Shift + mouse move to pan.
 */
sm.addHorizontalPan = function(container, extent) {
    var pan = function(offset) {
        var t = d3.transform(container.attr("transform"));
        t.translate[0] = Math.max(-extent[1], Math.min(extent[0], t.translate[0] + offset));
        container.attr("transform", "translate(" + t.translate + ")");
    };

    // Key
    document.addEventListener("keydown", function(e) {
        var offset = e.keyCode === 37 ? 120 : e.keyCode === 39 ? -120 : 0;
        pan(offset);
    });

    // Add invisible rectangle covering the entire space to listen to mouse event.
    // Otherwise, only zoom when mouse-overing visible items.
    var readyToPan = false,
        prevX,
        parent = d3.select(container.node().parentNode);
    var rect = parent.insert("rect", ":first-child")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("fill", "none")
        .style("pointer-events", "all");

    // Only pan when dragging left-button mouse and holding Shift, or dragging on a void space
    parent.on("mousedown", function() {
        if (d3.event.which === 1 && (d3.event.shiftKey || d3.event.target === rect.node())) {
            readyToPan = true;
            prevX = d3.event.clientX;
        }
    }).on("mouseup", function() {
        readyToPan = false;
    }).on("mouseout", function() {
        readyToPan = false;
    }).on("mousemove", function() {
        if (readyToPan) {
            pan(d3.event.clientX - prevX);
            prevX = d3.event.clientX;
            d3.event.preventDefault();
        }
    });
};

/**
 * Adds an arrow-head marker defs to the given SVG node.
 */
sm.createArrowHeadMarker = function(parent, id, fillColor) {
    d3.select(parent).append("defs").append("marker")
        .attr("id", id)
        .attr("viewBox", "-7 -3 6 6")
        .attr("refX", -1)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
            .append("polyline")
            .attr("points", "-5,0 -7,3 -1,0 -7,-3")
            .attr("fill", fillColor);
};

/**
 * Periodically check if all images are loaded. If yes, invoke the given callback.
 */
sm.checkImagesLoaded = function(nodes, callback) {
    var id = setInterval(function() {
        var loaded = true;
        nodes.each(function(d) {
            var img = d3.select(this).select("img");
            if (img.attr("src") && img.style("width") === "0px") {
                loaded = false;
            }
        });

        if (loaded) {
            // Stop checking
            clearInterval(id);
            callback();
        }
    });
};

/**
 * Shows a modal dialog.
 */
sm.modal = function(head, body, draggable, x, y) {
    var dialog = d3.select("body").append("div").attr("class", "modal fade").attr("tabindex", -1);
    var content = dialog.append("div").attr("class", "modal-dialog modal-lg")
        .append("div").attr("class", "modal-content");

    var header = content.append("div").attr("class", "modal-header");
    header.append("button").attr("class", "close").attr("data-dismiss", "modal").html("&times;");
    header.append("h4").attr("class", "modal-title").html(head);

    content.append("div").attr("class", "modal-body").append("div").html(body);

    $(dialog.node()).modal();

    if (draggable) {
        dialog = dialog.node();
        $(dialog).draggable({ handle: ".modal-header" }); // Need jquery-ui
        $(dialog).find(".modal-backdrop").css("display", "none");

        if (x !== undefined && y !== undefined) {
            $(dialog).css({
                left: x,
                top: y,
                bottom: "auto",
                right: "auto"
            });
        }
    }
};

/**
 * Shows quick view of the given url.
 */
sm.quickView = function(url) {
    var dialog = d3.select("body").append("div").attr("class", "modal fade").attr("tabindex", -1);
    var content = dialog.append("div").attr("class", "modal-dialog modal-lg")
        .append("div").attr("class", "modal-content");

    content.append("div").attr("class", "modal-body").style("height", "90%").append("iframe")
        .attr("width", "100%")
        .attr("height", "90%")
        .attr("src", url);

    $(dialog.node()).modal();
};

/**
 * Shows provenance capture dialog
 */
sm.showCaptureDialog = function(info, callback) {
    var dialog = d3.select("body").append("div").attr("class", "modal fade").attr("tabindex", -1);
    var content = dialog.append("div").attr("class", "modal-dialog modal-lg")
        .append("div").attr("class", "modal-content");

    var header = content.append("div").attr("class", "modal-header");
    header.append("button").attr("class", "close").attr("data-dismiss", "modal").html("&times;");
    header.append("h4").attr("class", "modal-title").html(info.title);

    var body = content.append("div").attr("class", "modal-body").append("div");
    body.append("img").attr("class", "img-responsive").style("max-height", $("body").height() * 0.8 + "px").attr("src", info.imgSrc);
    body.append("textarea").attr("rows", 4).style("width", "100%").style("margin-top", "20px").attr("class", "form-control").attr("placeholder", "Enter your note");

    var footer = content.append("div").attr("class", "modal-footer");
    footer.append("button").attr("class", "btn btn-primary").text("Submit")
        .on("click", function() {
            if (callback) {
                callback(body.select("textarea").node().value);
            }
            $(dialog.node()).modal("hide");
        });
    footer.append("button").attr("class", "btn btn-default").text("Cancel")
        .on("click", function() {
            $(dialog.node()).modal("hide");
        });

    $(dialog.node()).modal().on('shown.bs.modal', function() {
        $(this).find("textarea").focus();
    });
};

/**
 * Shows a dialog with a text input or textarea.
 */
sm.showTextDialog = function(info, isInput, callback) {
    var dialog = d3.select("body").append("div").attr("class", "modal fade").attr("tabindex", -1);
    var content = dialog.append("div").attr("class", "modal-dialog modal-sm")
        .append("div").attr("class", "modal-content");

    if (info.title) {
        var header = content.append("div").attr("class", "modal-header");
        header.append("button").attr("class", "close").attr("data-dismiss", "modal").html("&times;");
        header.append("h4").attr("class", "modal-title").html(info.title);
    }

    var body = content.append("div").attr("class", "modal-body").style("padding-top", "0").append("div");
    var input = body.append(isInput ? "input" : "textarea").attr("class", "form-control input")
        .attr("rows", 3)
        .attr("placeholder", "Enter your text")
        .style("width", "100%")
        .style("margin-top", "15px")
        .on("keydown", function () {
            if (d3.event.keyCode === 13) {
                onSave();
            }
        });
    $(input.node()).val(info.value);

    var onSave = function() {
        if (callback) {
            callback(body.select(".input").node().value);
        }
        onClose();
    };

    var onClose = function() {
        $(dialog.node()).modal("hide");
    };

    var footer = content.append("div").attr("class", "modal-footer");
    footer.append("button").attr("class", "btn btn-primary").text("Save")
        .on("click", onSave);
    footer.append("button").attr("class", "btn btn-default").text("Cancel")
        .on("click", onClose);

    $(dialog.node()).modal().on('shown.bs.modal', function() {
        $(this).find(".input").select();
    });
};

/**
 * Shows a plain dialog.
 */
sm.showSimpleDialog = function(container, title, content, x, y, w, h) {
    // Show a rectangle with text atop
    var dialog = container.append('g').attr('class', 'sm-simple-dialog')
        .attr('transform', 'translate(' + (x - 5) + ',' + (y - 5) + ')');
    dialog.append('rect')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('width', w + 10)
        .attr('height', h + 10);
    dialog.append('text').attr('class', 'sm-simple-dialog-title')
        .text(title)
        .attr('x', w / 2)
        .attr('y', 5);
    dialog.append('text').attr('class', 'sm-simple-dialog-content')
        .text(content);
    dialog.append('text').attr('class', 'sm-simple-dialog-close')
        .text('✖')
        .attr('x', (w + 5))
        .on('click', function() {
            d3.select(this.parentNode).remove();
        });
};