/**
 * Declares the core object "sm" of the library and includes essential helper functions.
 */
var sm = function() {
    var sm = {
        host: "http://bigdata.mdx.ac.uk/",
        // host: "http://localhost/",
        vis: {},
        layout: {},
        misc: {}
    };

    sm.TRANSITION_DURATION = 500;

    /**
     * Checks whether the DOM element contains a given point.
     */
    Element.prototype.containsPoint = function(pos) {
        var rect = this.getBoundingClientRect();
        return pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom;
    };

    /**
     * Checks whether the DOM element intersects with the other element.
     */
    Element.prototype.intersect = function(d) {
        var r1 = this.getBoundingClientRect();
        var r2 = d.getBoundingClientRect();
        if (r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom) return null;

        var x = (Math.max(r1.left, r2.left) + Math.min(r1.right, r2.right)) / 2;
        var y = (Math.max(r1.top, r2.top) + Math.min(r1.bottom, r2.bottom)) / 2;
        return { x: x, y: y };
    };

    /**
     * Returns the center of the DOM element.
     */
    Element.prototype.getCenterPoint = function() {
        var rect = this.getBoundingClientRect();
        return rect ? { "x": rect.left + rect.width / 2, "y": rect.top + rect.height / 2 } : null;
    };

    /**
     * Moves the DOM element to front.
     */
    Element.prototype.moveToFront = function() {
        this.parentNode.appendChild(this);
    };

    /**
     * Moves the selection to front.
     */
    d3.selection.prototype.moveToFront = function() {
        return this.each(function() {
            this.moveToFront();
        });
    };

    return sm;
}();