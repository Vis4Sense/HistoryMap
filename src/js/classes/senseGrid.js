/**
 * grid provides a simple grid layout for a directed acyclic graph.
 * It's used together with another layout on the same data object, so it can't use standard {x, y} attributes.
 * It assigns v.rp.x and v.rp.y for vertices, and e.rpoints for edges.
 *
 * Created from layout/grid.js by Steve on 14.10.2016.
 */
class SenseGrid {
    constructor() {
        var grid = this,
            vertices, edges, // data input
            newVertices,
            width, height, // constrained size
            children = d => d.slaves,
            label = d => d.label;
        // the actual size that the graph has
        this.graphWidth = 0;
        this.graphHeight = 0;

        /**
         * Computes the layout.
         */
        this.compute = function() {
            newVertices = vertices.filter(v => v.newlyCurated);
            let isFirstNode = vertices.length === 1 && newVertices.length === 1;
            // Reassign computed location to expected attributes.
            // Need to shift new nodes to avoid overlapping with existing ones.
            grid.graphWidth = d3.max(vertices, v => v.curated.x + v.curated.width) || 0;
            grid.graphHeight = isFirstNode ? 0 : d3.max(vertices, v => v.curated.y + v.curated.height);
            newVertices.forEach(v => {
                v.curated.x = 0;
                v.curated.y = grid.graphHeight + (grid.graphHeight ? 20 : 0);
            });

            return grid.size();
        };

        /**
         * Sets/gets vertices.
         */
        this.vertices = function(value) {
            if (!arguments.length) {
                return vertices;
            }
            vertices = value;
            return grid;
        };

        /**
         * Sets/gets edges. Assumes that each edge has 'source' and 'target' attributes referring to their objects.
         */
        this.edges = function(value) {
            if (!arguments.length) {
                return edges;
            }
            edges = value;
            return grid;
        };

        /**
         * Sets/gets the constrained width of the layout.
         */
        this.width = function(value) {
            if (!arguments.length) {
                return width;
            }
            width = value;
            return grid;
        };

        /**
         * Sets/gets the constrained height of the layout.
         */
        this.height = function(value) {
            if (!arguments.length) {
                return height;
            }
            height = value;
            return grid;
        };

        /**
         * Sets/gets the label accessor.
         */
        this.label = function(value) {
            if (!arguments.length) {
                return label;
            }
            label = value;
            return grid;
        };

        /**
         * Sets/gets the children accessor.
         */
        this.children = function(value) {
            if (!arguments.length) {
                return children;
            }
            children = value;
            return grid;
        };

        /**
         * Gets the computed size of the graph
         */
        this.size = function() {
            grid.graphWidth = d3.max(vertices, v => v.curated.x + v.curated.width) || 0;
            grid.graphHeight = d3.max(vertices, v => v.curated.y + v.curated.height) || 0;

            return {width: grid.graphWidth, height: grid.graphHeight};
        };

    }
    /**
     * Get the new coordinates according to grids
     *
     * @param {{x: Number, y: Number, width: Number, height: Number}} data
     * @returns {{x: Number, y: Number}}
     */
    calcGridPoint(data) {
        if (data.width === undefined || data.height === undefined) {
            return {x: data.x, y: data.y};
        }
        data.x = isNaN(data.x) ? 0 : data.x;
        data.y = isNaN(data.x) ? 0 : data.y;
        data.x = smartRound(data.x, Math.round(data.width / 2));
        data.y = smartRound(data.y, Math.round(data.height / 2));
        return {x: data.x, y: data.y};
        /**
         * Smart round of the arg to the radius
         *
         * @param {Number} arg
         * @param {Number} radius
         * @returns {Number}
         */
        function smartRound(arg, radius) {
            var result = arg;
            if (arg != undefined && radius != undefined) {
                result = arg % radius < radius / 2 ? arg - (arg % radius) : arg + radius - (arg % radius);
            }
            return result;
        }
    }
}
