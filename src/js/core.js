/**
 * Declares the core object 'sm' of the library and includes essential helper functions.
 */
var sm = function() {
    var sm = {
        TRANSITION_DURATION: 500,
        // host: 'http://bigdata.mdx.ac.uk/',
        host: 'http://localhost/',
        vis: {},
        layout: {},
        provenance: {},
        misc: {}
    };

    return sm;
}();
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
    if (r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom) {
        return null;
    }

    var x = (Math.max(r1.left, r2.left) + Math.min(r1.right, r2.right)) / 2;
    var y = (Math.max(r1.top, r2.top) + Math.min(r1.bottom, r2.bottom)) / 2;
    return {x: x, y: y};
};
/**
 * Returns the center of the DOM element.
 */
Element.prototype.getCenterPoint = function() {
    var rect = this.getBoundingClientRect();
    return rect ? {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2} : null;
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

JSON.stringifyOnce = function(obj, replacer, indent) {
    var printedObjects = [];
    var printedObjectKeys = [];

    function printOnceReplacer(key, value) {
        /**
         * browsers will not print more than 20K, I don't see the point to allow 2K..
         * algorithm will not be fast anyway if we have too many objects
         */
        if (printedObjects.length > 2000) {
            return 'object too long';
        }
        var printedObjIndex = false;
        printedObjects.forEach(function(obj, index) {
            if (obj === value) {
                printedObjIndex = index;
            }
        });
        //root element
        if (key == '') {
            printedObjects.push(obj);
            printedObjectKeys.push('root');
            return value;
        } else if (printedObjIndex + '' != 'false' && typeof(value) == 'object') {
            if (printedObjectKeys[printedObjIndex] == 'root') {
                return '(pointer to root)';
            } else {
                let checking = !!value && !!value.constructor,
                    name = checking ? value.constructor.name.toLowerCase() : typeof(value);
                return '(see ' + name + ' with key ' + printedObjectKeys[printedObjIndex] + ')';
            }
        } else {

            var qualifiedKey = key || '(empty key)';
            printedObjects.push(value);
            printedObjectKeys.push(qualifiedKey);
            if (replacer) {
                return replacer(key, value);
            } else {
                return value;
            }
        }
    }

    return JSON.stringify(obj, printOnceReplacer, indent);
};
