$(function() {
    var participants = [ 'aaron', 'ben', 'mabs', 'magda', 'reggie' ],
        // The maximum amount of ms that the user can be idle but still consider active
        maxIdleTime = 60000,
        // The minimum amount of ms that the use must be in a view to be considered as working,
        // he may just accidentally openning a view and leave immediately
        minWorkingTime = 5000,
        segmentHeight = 20;

    var browserTypes = [ 'search', 'location', 'dir', 'highlight', 'note', 'filter', 'link', 'type', 'bookmark', 'save-image' ],
        colTypes = [ 'remove-collection-node', 'favorite-node', 'unfavorite-node', 'minimize-node', 'restore-node', 'curate-node', 'collection-zoom-in', 'collection-zoom-out' ],
        curTypes = [ 'remove-curation-node', 'move-node', 'add-link', 'remove-link', 'curation-zoom-in', 'curation-zoom-out' ],
        mixedTypes = [ 'click-node', 'revisit' ];

    var margin = { top: 5, right: 5, bottom: 5, left: 5 },
        width = 1000,
        height = 200;

    var svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

    var columnNames = [ 'participant', 'browser', 'collection', 'curation', 'brow-col', 'brow-cur', 'col-cur',
        'click-node', 'highlight', 'note', 'save-image', 'favorite-node', 'unfavorite-node',
        'minimize-node', 'restore-node', 'curate-node',
        'remove-curation-node', 'move-node', 'add-link', 'remove-link' ];

    buildTableStructure(columnNames);

    participants.forEach((p, i) => {
        var browserPath = "../../user-study/" + p + "/real/browser.json",
            smPath = "../../user-study/" + p + "/real/sensemap.json";

        d3.json(browserPath, browserFile => {
            d3.json(smPath, smFile => {
                var browserData = preprocessBrowserData(browserFile);
                var smData = preprocessSenseMapData(smFile);
                var segments = extractSegments(browserData);
                var actions = extractActions(smData);
                var scale = buildScale(segments);
                computeLayout(segments, actions, scale);
                computeStats(segments, actions, columnNames, p);
                buildVis(p, margin.left, margin.top + i * 60, segments, actions, scale);
            });
        });
    });

    function preprocessBrowserData(f) {
        var browserData = f.data;
        browserData.forEach(d => {
            d.time = new Date(d.time);
        });

        // Events should be in temporal already. However, due to message passing, it may be wrong.
        browserData.sort((a, b) => d3.ascending(a.time, b.time));

        return browserData;
    }

    function preprocessSenseMapData(f) {
        // 'click-node' is already 'revisit'
        // 'save-image': forget to save time!
        // smData = smFile.data.filter(d => d.type !== 'revisit' && d.type !== 'save-image');
        var smData = f.data;
        smData.forEach(d => {
            d.time = new Date(d.time);
        });

        return smData;
    }

    function buildScale(actions) {
        var min = d3.min(actions, d => d.startTime),
            max = d3.max(actions, d => d.endTime);
        return d3.time.scale()
            .domain([ min, max ])
            .range([ 0, width ]);
    }

    function extractSegments(browserData) {
        // A segment is a period that the user spends on a particular view
        // It consists of multiple events happening on the same view 
        var lastView, s, segments = [];
        browserData.forEach(d => {
            // type is 'col-xxx', 'cur-xxx', or just 'xxx'
            var hyphenPos = d.type.indexOf('-');
            var view = hyphenPos === -1 ? 'browser' : d.type.substr(0, hyphenPos);

            if (view !== lastView) {
                // Different view, save the current segment and create a new one
                if (s && s.endTime - s.startTime >= minWorkingTime) {
                    segments.push(s);
                }

                s = { view: view, startTime: d.time, endTime: d.time };
                lastView = view;
            } else {
                // Same view. If it isn't too far away from the previous one, combine them.
                // Otherwise, starting a new segment
                if (d.time - s.endTime < maxIdleTime) {
                    s.endTime = d.time;
                } else {
                    // Finish the existing one
                    if (s.endTime - s.startTime >= minWorkingTime) {
                        segments.push(s);
                    }

                    // New one
                    s = { view: view, startTime: d.time, endTime: d.time };
                }
            }
        });

        // The first segment is usually collection because the extension starts on that view.
        // So, should ignore it.
        if (segments[0].view === 'col') segments.shift();
        if (segments[0].view === 'col') segments.shift(); // one participant started very early and did nothing for a while

        return segments;
    }

    function extractActions(smData) {
        return smData.map(d => {
            var view;
            if (browserTypes.includes(d.type)) {
                view = 'browser';
            } else if (colTypes.includes(d.type)) {
                view = 'col';
            } else if (curTypes.includes(d.type)) {
                view = 'cur';
            } else if (mixedTypes.includes(d.type)) {
                view = 'mixed';
            } else {
                console.error('type missed', d.type);
            }

            return {
                view: view,
                time: d.time,
                type: d.type
            };
        });
    }

    function computeLayout(segments, actions, scale) {
        var timeFormat = d3.time.format('%X');

        segments.forEach(s => {
            s.x = scale(s.startTime);
            s.y = 0;
            s.width = Math.max(1, scale(s.endTime) - scale(s.startTime));
            s.height = segmentHeight;

            s.duration = s.endTime - s.startTime;
            s.title = 'start at ' + timeFormat(s.startTime) + ', spent ' + Math.round(s.duration / 1000) + 's in ' + s.view;
        });

        actions.forEach(a => {
            a.x = scale(a.time);
            a.y = segmentHeight / 2;

            a.title = a.type + ' at ' + timeFormat(a.time);
        });
    }

    function buildTableStructure() {
        var head = d3.select('thead');
        var tr = head.append('tr');
        columnNames.forEach(c => {
            tr.append('th').attr('class', 'text-center').text(c);
        });
    }

    function addCells(tr, ...texts) {
        texts.forEach(t => {
            var td = tr.append('td');

            if (participants.includes(t)) {
                var href = "../../user-study/" + t + "/screenshot.png";
                td.html("<a target='_blank' href=" + href + ">" + t + "</a>");
            } else {
                td.text(t);
            }
        });
    }

    function computeStats(segments, actions, columnNames, name) {
        // Build HTML table
        var body = d3.select('tbody');
        var tr = body.append('tr');
        addCells(tr, name);

        // 1. How long did the user spend in each view?
        // -> Sum of segments
        var browserTime = Math.round(d3.sum(segments.filter(s => s.view === 'browser'), d => d.duration) / 1000 / 60),
            colTime = Math.round(d3.sum(segments.filter(s => s.view === 'col'), d => d.duration) / 1000 / 60),
            curTime = Math.round(d3.sum(segments.filter(s => s.view === 'cur'), d => d.duration) / 1000 / 60),
            totalTime = browserTime + colTime + curTime,
            browserTimePercent = Math.round(browserTime / totalTime * 100),
            colTimePercent = Math.round(colTime / totalTime * 100),
            curTimePercent = 100 - browserTimePercent - colTimePercent;
        addCells(tr, browserTime + ' mins (' + browserTimePercent + '%)',
            colTime + ' mins (' + colTimePercent + '%)',
            curTime + ' mins (' + curTimePercent + '%)');

        // 2. How often do they switch among views?
        var browserCol = 0, browserCur = 0, colCur = 0;
        segments.reduce((p, c) => {
            if (p.view !== c.view) {
                if (p.view === 'browser' && c.view === 'col' || p.view === 'col' && c.view === 'browser') browserCol++;
                if (p.view === 'browser' && c.view === 'cur' || p.view === 'cur' && c.view === 'browser') browserCur++;
                if (p.view === 'cur' && c.view === 'col' || p.view === 'col' && c.view === 'cur') colCur++;
            }

            return c;
        });
        addCells(tr, browserCol, browserCur, colCur);

        // 3. Curation support: action stats
        var counts = _.countBy(actions, 'type');
        addCells(tr, ...columnNames.slice(7).map(t => {
            if (t === 'click-node') {
                return counts[t] + '/' + counts.revisit + ' (' + (Math.round(counts[t] / counts.revisit * 100)) + '%)';
            } else {
                return counts[t];
            }
        }));
    }

    function buildVis(title, left, top, segments, actions, scale) {
        // Title
        svg.append('text')
            .attr("transform", "translate(" + left + "," + top + ")")
            .text(title)
            .style('font-weight', 'bold');

        var container = svg.append("g").attr("transform", "translate(" + (left + 60) + "," + top + ")");

        // Axis
        var axis = d3.svg.axis().scale(scale);
        container.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + segmentHeight + ")")
            .call(axis)
            .selectAll("text")
                .attr("y", -2);

        // Segments
        var items = container.selectAll('g.segment').data(segments).enter()
            .append('g').attr('class', 'segment');
        items.append('rect')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('width', d => d.width)
            .attr('height', d => d.height)
            .attr('class', d => d.view)
            .append('title').text(d => d.title);

        // Actions
        // items = container.selectAll('g.action').data(actions).enter()
        //     .append('g').attr('class', 'action');
        // items.append('circle')
        //     .attr('cx', d => d.x)
        //     .attr('cy', d => d.y)
        //     .attr('r', 3)
        //     .attr('class', d => d.view)
        //     .append('title').text(d => d.title);
    }
});