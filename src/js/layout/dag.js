/**
 * dag provides a hierarchical layout for an directed acyclic graph.
 */
sm.layout.dag = function() {
    var module = {};

    var vertices, edges, // data input
        n, // vertices.length
        allVertices, // include dummy vertices
        layers, // vertices group by layer
        centers, // center points of layers
        width, height, // constrained size
        direction = 'lr', // tb, bt, lr, rl
        align = 'ul', // ul, ur, dl, dr
        maxVerticesPerLayer = 4,
        layering = 'simplex', // longest/cg/simplex
        ordering = 'bary', // adjacent/bary
        minLength = 1, // for network simplex layering, the minimum layers in between of two edge's nodes, normally 1
        vertexSep = 15, // space between two sibling vertices
        layerSep = 40, // space between two consecutive layers
        tipLength = 16;

    /**
     * The flow of the graph is horizontal or vertical.
     */
    function isHori() {
        return direction === 'lr' || direction === 'rl';
    }

    /**
     * Does some proprocessing stuffs.
     */
    function preCompute() {
        // Reset edges of vertices
        vertices.forEach(v => {
            v.inEdges = [];
            v.outEdges = [];
        });

        // Convert source and target of edges to data objects
        edges.forEach(e => {
            e.source.outEdges.push(e);
            e.target.inEdges.push(e);
        });

        // Utitlity
        n = vertices.length;
    }

    function assignLayers() {
        if (layering === 'longest') longestPath();
        if (layering === 'cg') coffmanGraham();
        if (layering === 'simplex') simplex();
    }

    // Longest-path algorithm: https://cs.brown.edu/~rt/gdhandbook/chapters/hierarchical.pdf, page 421
    // Output: each vertex is assigned a 'layer' attribute for its layer.
    function longestPath() {
        // The algorithm assigns vertices layer by layer. This is the layer currently being processed.
        // Initially set to 0 - the lowest layer
        var currentLayer = 0;

        // All vertices already assigned to the current layer
        var currentLayerAssignedVertices = new Set();

        // All vertices not assigned to any layer
        var nonAssignedVertices = new Set([...vertices]);

        // All vertices already assigned to a layer that is smaller (below) than the current layer
        var belowCurrentLayerAssignedVertices = new Set();

        while (nonAssignedVertices.size) {
            // Select a non-assigned vertex that its immedidate successors already assigned to the layer below the current one
            var v = undefined;
            nonAssignedVertices.forEach(n => {
                if (v) return;
                if (!n.outEdges.length || n.outEdges.every(e => belowCurrentLayerAssignedVertices.has(e.target))) v = n;
            });

            if (v) {
                v.layer = currentLayer;
                currentLayerAssignedVertices.add(v);
                nonAssignedVertices.delete(v);
            } else {
                currentLayer++;
                belowCurrentLayerAssignedVertices = new Set([...belowCurrentLayerAssignedVertices, ...currentLayerAssignedVertices]);
                currentLayerAssignedVertices.clear();
            }
        }
    }

    // Coffman-Graham alogrithm: https://cs.brown.edu/~rt/gdhandbook/chapters/hierarchical.pdf, page 422
    // Output: each vertex is assigned a 'layer' attribute for its layer.
    function coffmanGraham() {
        doTransitiveReduction();

        // Unlabeled
        vertices.forEach(v => {
            v.pi = Number.POSITIVE_INFINITY;
        });

        for (var i = 0; i < n; i++) {
            // Choose an unlabeled vertex v such that the label of N(v), a set of incoming neighbors, is minimized
            var unlabels = vertices.filter(v => v.pi === Number.POSITIVE_INFINITY).slice(); // doesn't want to change order of original vertices
            unlabels.sort(function(a, b) {
                return compareLabelSet(a.inEdges.map(e => e.source.pi), b.inEdges.map(e => e.source.pi));
            });

            // Label the minimal one
            unlabels[0].pi = i;
            // console.log(unlabels[0].label + '\t' + i);
        }

        // All vertices already assigned to the current layer
        var currentLayerAssignedVertices = new Set();

        // All vertices not assigned to any layer
        var nonAssignedVertices = new Set([...vertices]);

        // All vertices already assigned to a layer that is smaller (below) than the current layer
        var belowCurrentLayerAssignedVertices = new Set();

        var currentLayer = 0;

        while (nonAssignedVertices.size) {
            // Select a non-assigned vertex so that its immedidate successors already assigned to the layer below the current one and have the largest label
            var candidates = Array.from(nonAssignedVertices).filter(v => !v.outEdges.length || v.outEdges.every(e => belowCurrentLayerAssignedVertices.has(e.target)));
            var v = _.max(candidates, 'pi');

            if (!candidates.length || currentLayerAssignedVertices.size >= maxVerticesPerLayer) {
                currentLayer++;
                belowCurrentLayerAssignedVertices = new Set([...belowCurrentLayerAssignedVertices, ...currentLayerAssignedVertices]);
                currentLayerAssignedVertices.clear();
            }

            if (candidates.length) {
                nonAssignedVertices.delete(v);
                v.layer = currentLayer;
                currentLayerAssignedVertices.add(v);
            }
        }
    }

    // A transitive reduction G' of G is the one that has fewest edges but with the same reachability as G.
    // Output: if edge e is reduced, e.reduced will be true.
    function doTransitiveReduction() {
        var m = buildPathMatrix(),
            a = _.range(n).map(() => _.range(n).map(() => false)); // Adjancency

        edges.forEach(e => {
            a[vertices.indexOf(e.source)][vertices.indexOf(e.target)] = e;
        });

        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                if (!m[i][j]) continue;
                for (var k = 0; k < n; k++) {
                    if (m[j][k] && m[i][k]) {
                        // Reduce if connecting
                        if (a[i][k]) {
                            a[i][k].reduced = true;
                            // console.log('remove ' + vertices[i].label + '\t' + vertices[k].label);
                        }

                        m[i][k] = false;
                    }
                }
            }
        }
    }

    // m[i][j] = true if [i] connects to [j]
    function buildPathMatrix() {
        // A 2d array as a matrix
        var m = _.range(n).map(() => _.range(n).map(() => false));

        edges.forEach(e => {
            m[vertices.indexOf(e.source)][vertices.indexOf(e.target)] = true;
        });

        for (var k = 0; k < n; k++) { // k is for k-step matrix (adjacency matrix is k=0)
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                    if (m[i][k] && m[k][j]) m[i][j] = true;
                }
            }
        }

        return m;
    }

    // lexicographic order: { 1, 4, 7 } < { 3, 8 }, { 3, 4, 9 } < { 1, 5, 9 }, empty < { 1 }
    function compareLabelSet(S, T) {
        if (S.length && T.length) {
            if (S[0] === T[0]) return compareLabelSet(S.slice(1), T.slice(1));
            return S[0] > T[0] ? 1 : -1;
        }

        return !S.length && !T.length ? 0 : S.length ? 1 : -1;
    }

    function simplex() {
        // Now, blindly get the result for dagre lib
        // Create a new directed graph
        var g = new dagre.graphlib.Graph();

        // Set an object for the graph label
        g.setGraph({ rankdir: direction, ranksep: layerSep, nodesep: vertexSep });

        // Default to assigning a new object as a label for each new edge.
        g.setDefaultEdgeLabel(function() { return {}; });

        // Add nodes and edges to the graph.
        vertices.forEach(v => { g.setNode(v.id, v); });
        edges.forEach(e => { g.setEdge(e.source.id, e.target.id); });

        dagre.layout(g);

        // Nodes in the same rank have the same centre's x value
        vertices.forEach(n => {
            n.layer = Math.round((isHori() ? n.x : n.y) / 10);
        });

        var ranks = _.uniq(vertices.map(n => n.layer)).sort(d3.ascending);

        // Reassign rank to the sorted index so that it has value as 0, 1, 2...
        vertices.forEach(n => {
            n.layer = ranks.indexOf(n.layer);
        });

        // dagre gives source layer < target layer. So revert it to the normal convention that source layer > target layer.
        var maxLayer = d3.max(vertices, v => v.layer);
        vertices.forEach(n => {
            n.layer = maxLayer - n.layer;
        });
    }

    function addDummyVertices() {
        var dummyVertices = [];
        var dummyCount = 0;
        edges.forEach(e => {
            // Note: source layer > target layer
            var span = e.source.layer - e.target.layer;
            if (span === 1) return;

            // Replace edge(u, v) with a path (u=v_1, ... v_span=v)
            e.dummyVertices = _.range(1, span).map(i => ({ dummy: true, layer: e.source.layer - i, width: 0, height: 0, label: dummyCount++ }));
            dummyVertices.push(...e.dummyVertices);
        });

        allVertices = vertices.concat(dummyVertices);

        // Split to layers
        layers = _.toArray(_.groupBy(allVertices, v => v.layer));

        // Find neighbors, including dummy ones.
        // L1 is at the top. If e(u->v) then u is in L2, v is in L1.
        allVertices.forEach(v => {
            v.upNeighbors = []; // v is source
            v.downNeighbors = []; // v is target
        });
        edges.forEach(e => {
            [ e.source ].concat(e.dummyVertices || []).concat([ e.target ]).reduce((prev, curr) => {
                curr.downNeighbors.push(prev);
                prev.upNeighbors.push(curr);
                return curr;
            });
        });
    }

    function orderVertices() {
        // bary twice and iterative adjacent
        ordering = 'bary';
        sweepGraph(true, true);
        var itNumCrossings = countCrossings();
        // console.log('#crossings = ' + itNumCrossings);

        sweepGraph();
        itNumCrossings = countCrossings();
        // console.log('#crossings = ' + itNumCrossings);

        // Iteratively sweep a pair of (top to bottom and bottom to top) and so on until no crossing is reduced
        ordering = 'adjacent';
        var count = 0;
        var numCrossings = itNumCrossings;
        var topToBottom = true;
        do {
            sweepGraph(topToBottom, !count);
            topToBottom = !topToBottom;
            var itNumCrossings = countCrossings();
            // console.log('#crossings = ' + itNumCrossings);

            if (itNumCrossings >= numCrossings) break;
            numCrossings = itNumCrossings;
            count++;
        } while (count < 20); // Just in case of any infinitive loop
    }

    function countCrossings() {
        return _.sum(layers.slice(1), countLayerCrossings);
    }

    /**
     * Counts the number of crossing between L2 and the above layer.
     */
    function countLayerCrossings(L2) {
        var c = 0;
        L2.slice(0, L2.length - 1).forEach((u, i) => {
            L2.slice(i + 1).forEach(v => {
                c += _.sum(u.upNeighbors, w => v.upNeighbors.filter(z => z.order < w.order).length);
            });
        })
        return c;
    }

    function sweepGraph(topToBottom, firstIteration) {
        // Choose an initial order for the first layer
        if (firstIteration) layers[0].forEach((v, i) => { v.order = i; });

        // Sweep layer by layer
        if (topToBottom) {
            for (var i = 1; i < layers.length; i++) {
                // console.log(i - 1 + ' and ' + i);
                sweep(layers[i], topToBottom, firstIteration);
            }
        } else {
            for (var i = layers.length - 2; i >=0; i--) {
                // console.log(i + 1 + ' and ' + i);
                sweep(layers[i], topToBottom, firstIteration);
            }
        }
    }

    /**
     * Find the order of L2 to minmize crossing between L2 and L1 given the fixed order of L1.                                                                                                                                                                                                                                                                                                                                                                                              * Orders layer i and layer i + 1.
     */
    function sweep(L2, topToBottom, firstIteration) {
        // Choose an initial order of L2
        if (firstIteration) L2.forEach((v, i) => { v.order = i; });

        var f = ordering === 'adjacent' ? adjacentExchange : barycenter;
        f.call(this, L2, topToBottom);
    }

    /**
     * Find the order of L2 using adjacent exchange method.
     */
    function adjacentExchange(L2, topToBottom) {
        var swapped;
        do {
            swapped = false;
            // Scan the vertices of L2 from left to right, exchanging an adjacent pair (u,v) if c_uv > c_vu
            for (var i = 0; i < L2.length - 1; i++) {
                if (checkCrossing(L2, i, topToBottom)) swapped = true;
            }
        } while (swapped);
    }

    /**
     * u = L2[i], v = L2[i + 1]
     * u is on the left of v.
     * Computes c_uv and c_vu. Swap the order if c_uv > c_vu.
     */
    function checkCrossing(L2, i, topToBottom) {
        var u = L2[i],
            v = L2[i + 1];

        if (u.order >= v.order) console.log('wronggggggg');

        // If either of u and v has no edges, there's no crossing
        if (!getNeighbors(u, topToBottom).length || !getNeighbors(v, topToBottom).length) return;

        var uv = _.sum(getNeighbors(u, topToBottom), w => getNeighbors(v, topToBottom).filter(z => z.order < w.order).length);
        var vu = _.sum(getNeighbors(v, topToBottom), z => getNeighbors(u, topToBottom).filter(w => w.order < z.order).length);

        if (uv > vu) {
            // console.log(i + '-' + (i + 1) + '\tswap ' + uv + '->' + vu);
            // Swap both the 'order' attribute and real order in the array
            var tmp = u.order;
            u.order = v.order;
            v.order = tmp;
            tmp = L2[i];
            L2[i] = L2[i + 1];
            L2[i + 1] = tmp;

            return true;
        } else {
            // console.log(i + '-' + (i + 1) + '\t ' + uv + ',' + vu);
        }

        return false;
    }

    function getNeighbors(v, up) {
        return up ? v.upNeighbors : v.downNeighbors;
    }

    /**
     * Find the order of L2 using barycenter.
     */
    function barycenter(L2, topToBottom) {
        // Compute and sort by barycenter
        L2.forEach(v => {
            var neighbors = getNeighbors(v, topToBottom);
            v.bary = neighbors.length ? d3.mean(neighbors, n => n.order) : 0;
        });
        L2.sort(function(a, b) { return d3.ascending(a.bary, b.bary); });

        // Show order
        L2.forEach((v, i) => { v.order = i; });

        // L2.forEach(v => { console.log(v.label + ': bary=' + v.bary + ', order=' + v.order); });
    }

    /*
     * http://algo.uni-konstanz.de/publications/bk-fshca-01.pdfhttp://algo.uni-konstanz.de/publications/bk-fshca-01.pdf
     */
    function assignCoordinates() {
        markType1Conflicts();

        // Set predecessor
        layers.forEach(vertices => {
            vertices.reduce((p, c) => {
                c.pred = p;
                return p.succ = c;
            });
        });

        if (align) {
            runOneAlignment();
        } else {
            balance();
        }

        alignLeftSide();
        setVerticalCoordinate();
        assignEdgePoints();
    }

    /**
     * Check position so that no cross between two alignments.
     */
    function verifyOrder(hori, prevOrder, order) {
        return hori === 'left' ? prevOrder < order : order < prevOrder;
    }

    function markType1Conflicts() {
        for (var i = 1; i < layers.length - 2; i++) {
            var vertices = layers[i];
            var k0 = 0,
                l = 0; // the one on the left of l1 below
            vertices.forEach((v, l1) => { // l1: current index
                var w = getUpperNodeOfInnerSegment(v),
                    k1 = w ? w.order : layers[i - 1].length;
                if (l1 === vertices.length - 1 || w) {
                    vertices.slice(l, l1 + 1).forEach(prev => {
                        prev.upNeighbors.forEach(u => {
                            if (u.order < k0 || u.order > k1) {
                                addConflict(prev, u); // Favor the inner segment
                                console.log('conflict')
                            }
                        });
                    });
                    l = l1 + 1;
                    k0 = k1;
                }
            });
        }
    }

    function getUpperNodeOfInnerSegment(v) {
        return v.upNeighbors.length !== 1 || !v.upNeighbors[0].dummy ? undefined : v.upNeighbors[0];
    }

    function addConflict(u, v) {
        if (!u.conflicts) u.conflicts = new Set();
        if (!v.conflicts) v.conflicts = new Set();
        u.conflicts.add(v);
        v.conflicts.add(u);
    }

    function isConflict(u, v) {
        return u.conflicts ? u.conflicts.has(v) : false;
    }

    /**
     * Produces blocks of vertices. Each block is a vertically aligned list of vertices.
     */
    function doVerticalAlignment(verti, hori) {
        // Init
        allVertices.forEach(v => {
            v.root = v.align = v;
        });

        // Tips: Use 'slice' to create a copy before reversing
        var myLayers = verti === 'down' ? layers.slice().reverse() : layers;

        myLayers.slice(1).forEach((vertices, i) => {
            var prevUpPos = hori === 'right' ? myLayers[i].length : -1;
            var myVertices = hori === 'right' ? vertices.slice().reverse() : vertices;

            myVertices.forEach(v => {
                var neighbors = verti === 'up' ? v.upNeighbors : v.downNeighbors;
                if (!neighbors.length) return;

                // Find the median of upper neighbors
                // sortBy doesn't modify array order? documentation says it is!
                neighbors = _.sortBy(neighbors, 'order');
                var m = (neighbors.length - 1) / 2;

                // Either one or two medians
                var medians = neighbors.length % 2 ? [ m ] : [ Math.floor(m), Math.ceil(m) ];
                if (hori === 'right') medians.reverse();
                medians.forEach(i => {
                    var u = neighbors[i];
                    if (v.align === v && verifyOrder(hori, prevUpPos, u.order) && !isConflict(u, v)) {
                        u.align = v;
                        v.align = v.root = u.root;
                        prevUpPos = u.order;
                    }
                });
            });
        });

        // Check block alignment
        // allVertices.forEach(v => {
        //     if (v.root === v) {
        //         console.log('------');
        //         var w = v;
        //         do {
        //             console.log(w);
        //             w = w.align;
        //         } while (w !== v);
        //     }
        // });
    }

    /**
     * Groups blocks into classes that share the same sink. Assumes that vertices flow right to left as well.
     */
    function doHorizontalCompaction(verti, hori) {
        // Size for each block
        allVertices.forEach(v => {
            if (v.root === v) {
                var w = v; // Go down its aligned vertices
                do {
                    v.blockSize = isHori() ? Math.max(v.height, w.height) : Math.max(v.width, w.width);
                    w = w.align;
                } while (w !== v); // Complete a cycle
            }
        });

        // Init
        allVertices.forEach(v => {
            v.sink = v;
            v.x = undefined;
            v.shift = Number.POSITIVE_INFINITY;
            v.dependentSinks = [];
        });

        // Root coordinates relative to sink
        allVertices.forEach(v => {
            if (v.root === v && v.x === undefined) placeBlock(v, hori);
        });

        // Check sink of class
        // allVertices.filter(v => v === v.root && v === v.sink).forEach(v => { console.log(v.label); });
        allVertices.forEach(v => {
            v.classLabel = v.root.sink.label;
        });

        // Absolute coordinates
        allVertices.forEach(v => {
            v.x = v.root.x;
        });
        allVertices.forEach(v => {
            if (v.root.sink.shift < Number.POSITIVE_INFINITY) v.x += v.root.sink.shift;
        });

        // Check coordinates
        // allVertices.forEach(v => { console.log(v.label + ':\t' + v.x); });

        // Save the computed x to combine later
        allVertices.forEach(v => {
            v[verti + hori] = v.x;
        });
    }

    function shiftDelta(s, delta) {
        console.log('shift: [' + delta + '] ' + s.label);

        if (s.shift < Number.POSITIVE_INFINITY) {
            s.shift += delta;
        } else {
            s.shift = delta;
        }

        s.dependentSinks.forEach(function(s2) {
            shiftDelta(s2, delta);
        });
    }

    /**
     * Assigns horizontal coordinate for the roots of blocks.
     */
    function placeBlock(v, hori) {
        // console.log('placing: ' + v.label);

        // Root will be shifted later.
        // Non-root are always undefined.
        v.x = 0;
        var w = v; // Go down its aligned vertices

        do {
            var b = hori === 'left' ? w.pred : w.succ;
            if (b) {
                var u = b.root;

                // Make sure all left blocks are placed.
                if (u.x === undefined) placeBlock(u, hori);

                if (v.sink === v) v.sink = u.sink;

                var gap = v.blockSize / 2 + u.blockSize / 2 + vertexSep;
                if (v.sink !== u.sink) { // Different classes
                    console.log('different class: ' + v.label + ' --- ' + u.label);

                    // Shift u's dependent sinks as well
                    var newShift = Math.min(u.sink.shift, v.x - u.x - gap);
                    var delta = u.sink.shift < Number.POSITIVE_INFINITY ? u.sink.shift - newShift : newShift;
                    shiftDelta(u.sink, delta);

                    v.sink.dependentSinks.push(u.sink);
                } else {
                    v.x = hori === 'left' ? Math.max(v.x, u.x + gap) : Math.min(v.x, u.x - gap);
                }
            }

            w = w.align;
        } while (w !== v); // Complete a cycle

        // console.log('placed: ' + v.label);
    }

    function runOneAlignment() {
        var verti = align[0] === 'u' ? 'up' : 'down',
            hori = align[1] === 'l' ? 'left' : 'right';
        doVerticalAlignment(verti, hori);
        doHorizontalCompaction(verti, hori);
    }

    function balance() {
        // Apply four alignments
        var alignmentSizes = [];
        [ 'up', 'down' ].forEach(verti => {
            [ 'left', 'right' ].forEach(hori => {
                doVerticalAlignment(verti, hori);
                doHorizontalCompaction(verti, hori);
                alignmentSizes.push({
                    verti: verti,
                    hori: hori,
                    min: d3.min(allVertices, v => v.x),
                    max: d3.max(allVertices, v => v.x)
                });
            });
        });

        // Align coordinates to the smallest width one
        var minWidthAlignment = _.min(alignmentSizes, s => s.max - s.min);
        alignmentSizes.forEach(s => {
            var delta = s.hori === 'left' ? s.min - minWidthAlignment.min : s.max - minWidthAlignment.max;
            var x = s.verti + s.hori;
            allVertices.forEach(v => {
                v[x] -= delta;
            });
        });

        // // Test: after aligning
        // alignmentSizes.forEach(s => {
        //     var x = s.verti + s.hori;
        //     console.log({
        //         min: d3.min(allVertices, v => v.x - (isHori() ? v.height : v.width) / 2),
        //         max: d3.max(allVertices, v => v.x + (isHori() ? v.height : v.width) / 2)
        //     });
        // });

        // Set to the average median of the four
        allVertices.forEach(v => {
            var theFour = _.sortBy([ v.upleft, v.upright, v.downleft, v.downright ]);
            v.x = (theFour[1] + theFour[2]) / 2;
        });
    }

    function alignLeftSide() {
        // Make sure the left side of the graph is visible
        leftMost = d3.min(allVertices, v => v.x - (isHori() ? v.height : v.width) / 2);
        allVertices.forEach(v => {
            v.x -= leftMost;
        });

        if (isHori()) {
            allVertices.forEach(v => {
                v.y = v.x;
            });
        }
    }

    function setVerticalCoordinate() {
        // The center of each layer.
        var lastBoundary = -layerSep;
        centers = layers.map((vertices, i) => {
            var s = isHori() ? d3.max(vertices, v => v.width) : d3.max(vertices, v => v.height);
            lastBoundary += layerSep + s;
            return lastBoundary - s / 2;
        });

        // Make it upside down so that the source is at the top
        if (direction === 'tb' || direction === 'lr') centers.reverse();

        layers.forEach(vertices => {
            vertices.forEach((v, i) => {
                // Top-left corner
                if (isHori()) {
                    v.y = v.y - v.height / 2;
                    v.x = centers[v.layer] - (v.width ? v.width / 2 : 0);
                } else {
                    v.x = v.x - v.width / 2;
                    v.y = centers[v.layer] - (v.height ? v.height / 2 : 0);
                }
            })
        });
    }


    function assignEdgePoints() {
        function getOutPos(v) {
            if (direction === 'lr') return v.x + v.width + tipLength / 2;
            if (direction === 'rl') return v.x - tipLength / 2;
            if (direction === 'tb') return v.y + v.height + tipLength / 2;
            if (direction === 'bt') return v.y - tipLength / 2;
        }

        function getInPos(v) {
            if (direction === 'lr') return v.x - tipLength;
            if (direction === 'rl') return v.x + v.width + tipLength;
            if (direction === 'tb') return v.y - tipLength;
            if (direction === 'bt') return v.y + v.height + tipLength;
        }

        // Find the location of the tips
        var layerTips = layers.map(vertices => {
            return {
                outPos: d3.max(vertices, getOutPos),
                inPos: d3.min(vertices, getInPos),
            }
        });

        edges.forEach(e => {
            // Add two extra dummy points at the two ends to lengthen the straight line
            // because dummy vertices are in the middle of the layer, it could cross the adjacent nodes
            if (e.dummyVertices && e.dummyVertices.length) {
                // The new dummy point is set to the middle of the target layer and the next one
                var d = e.dummyVertices[0];
                x = isHori() ? layerTips[d.layer].inPos : d.x;
                y = isHori() ? d.y : layerTips[d.layer].inPos;

                // Notes: dummy verticess are ordered starting with the target
                e.dummyVertices.unshift({ x: x, y: y });

                // The second one: source and next layer
                d = _.last(e.dummyVertices);
                x = isHori() ? layerTips[d.layer].outPos : d.x;
                y = isHori() ? d.y : layerTips[d.layer].outPos;
                e.dummyVertices.push({ x: x, y: y });
            }

            e.points = [
                { x: e.source.x, y: e.source.y, width: e.source.width, height: e.source.height },
                { x: e.target.x, y: e.target.y, width: e.target.width, height: e.target.height }
            ];

            // Set the path for long edge
            if (e.dummyVertices) e.points.splice(1, 0, ...e.dummyVertices);

            if (!tipLength) {
                // Adjust to get the two end points from the rectangle edge
                e.points[0].x += e.source.width / 2;
                e.points[0].y += e.source.height / 2;
                e.points[0] = getRectEdgePoint(e.points[0], e.points[1]);

                var i = e.points.length - 1;
                e.points[i].x += e.target.width / 2;
                e.points[i].y += e.target.height / 2;
                e.points[i] = getRectEdgePoint(e.points[i], e.points[i - 1]);
            }
        });

        // When tipLength is specified, replace the two end points to 4 other points.
        // These 4 points produce 2 segments, one for each end, parallel with the flow of the graph.
        if (tipLength) {
            var layerWidths = layers.map(vertices => d3.max(vertices, v => v.width));
            var layerHeights = layers.map(vertices => d3.max(vertices, v => v.height));

            var scaleOut = d3.scale.ordinal(),
                scaleIn = d3.scale.ordinal();
            vertices.forEach(v => {
                // Distribute the end point of neighboring edges rather than always in the center
                scaleOut.domain(_.range(v.outEdges.length)).rangePoints([ 0, isHori() ? v.height : v.width ], 1);

                // Increasing as from left to right
                var sortField = isHori() ? 'y' : 'x';
                v.outEdges.sort((a, b) => { return d3.ascending(a.points[1][sortField], b.points[1][sortField]); });

                // Make the tips in the middle longer to give bigger angles [0, 1, 2, 2, 1, 0]
                var n = v.outEdges.length;
                var deltas = _.range(n);
                var m = Math.floor((n - 1) / 2);
                for (var i = m + 1; i < n; i++) {
                    deltas[i] = n - i - 1;
                }

                v.outEdges.forEach((e, i) => {
                    var p0 = e.points[0], // top-left
                        p1 = _.last(e.points),
                        c0, c1, c2, c3;

                    // Order of this edge's target
                    e.target.inEdges.sort((a, b) => { return d3.ascending(a.points[a.points.length - 2][sortField], b.points[b.points.length - 2][sortField]); });
                    scaleIn.domain(_.range(e.target.inEdges.length)).rangePoints([ 0, isHori() ? e.target.height : e.target.width ], 1);
                    var j = e.target.inEdges.indexOf(e);

                    if (isHori()) {
                        c0 = { x: p0.x + (direction === 'lr' ? p0.width : 0), y: p0.y + scaleOut(i) };
                        c1 = { x: layerTips[v.layer].outPos + deltas[i] * 2, y: c0.y };
                        c2 = { x: layerTips[e.target.layer].inPos, y: p1.y + scaleIn(j) };
                        c3 = { x: p1.x + (direction === 'rl' ? p1.width : 0), y: c2.y };
                    } else {
                        c0 = { x: p0.x + scaleOut(i), y: p0.y + p0.height };
                        c1 = { x: c0.x, y: layerTips[v.layer].outPos + deltas[i] * 2 };
                        c2 = { x: p1.x + scaleIn(j), y: layerTips[e.target.layer].inPos };
                        c3 = { x: c2.x, y: p1.y };
                    }

                    // Assign and replace later so that new vertices don't affect the process
                    e.newPoints = [ c0, c1, c2, c3 ];
                });
            });

            // Replace
            edges.forEach(e => {
                e.points.splice(0, 1, e.newPoints[0], e.newPoints[1]);
                e.points.splice(e.points.length - 1, 1, e.newPoints[2], e.newPoints[3]);
            });
        }
    }

    /*
     * Finds where a line starting at point ({x, y}) would intersect a rectangle
     * ({x, y, width, height}) if it were pointing at the rectangle's center.
     */
    function getRectEdgePoint(rect, point) {
        var x = rect.x,
            y = rect.y;

        var dx = point.x - x,
            dy = point.y - y,
            w = rect.width / 2,
            h = rect.height / 2;

        // The point is exactly the rectangle's center
        if (!dx && !dy) throw new Error("Not possible to find intersection inside of the rectangle");

        // The line can intersect the rectangle at either of the 4 sides. Find which side then easily work out the intersection.
        var sx, sy;
        if (Math.abs(dy) * w > Math.abs(dx) * h) { // Top or bottom side
            if (dy < 0) { // Top
                h = -h;
            }
            sx = h * dx / dy;
            sy = h;
        } else { // Left or right side
            if (dx < 0) { // Left
                w = -w;
            }
            sx = w;
            sy = w * dy / dx;
        }

        return { x: x + sx, y: y + sy };
    }

    /**
     * Computes the layout.
     */
    module.compute = function() {
        preCompute();
        assignLayers();
        addDummyVertices();
        orderVertices();
        assignCoordinates();

        return { width: d3.max(allVertices, v => v.x + v.width / 2 ) };
    };

    /**
     * Sets/gets vertices.
     */
    module.vertices = function(value) {
        if (!arguments.length) return vertices;
        vertices = value;
        return this;
    };

    /**
     * Sets/gets edges. Assumes that each edge has 'source' and 'target' attributes refering to their objects.
     */
    module.edges = function(value) {
        if (!arguments.length) return edges;
        edges = value;
        return this;
    };

    /**
     * Sets/gets the constrained width of the layout.
     */
    module.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return this;
    };

    /**
     * Sets/gets the constrained height of the layout.
     */
    module.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return this;
    };

    /**
     * Sets/gets spacing between cells in the same layer.
     */
    module.intraCellSpacing = function(value) {
        if (!arguments.length) return intraCellSpacing;
        intraCellSpacing = value;
        return this;
    };

    /**
     * Sets/gets spacing between layers.
     */
    module.interlayerCellSpacing = function(value) {
        if (!arguments.length) return interlayerCellSpacing;
        interlayerCellSpacing = value;
        return this;
    };

    return module;
};