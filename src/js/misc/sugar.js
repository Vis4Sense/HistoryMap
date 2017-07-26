String.prototype.replaceAll = function(str1, str2, ignore) {
    var ignoreFlag = ignore ? 'gi' : 'g',
        replaceString = typeof str2 == 'string' ? str2.replace(/\$/g, '$$$$') : str2;
    return this.replace(new RegExp(
        str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'),
        ignoreFlag
    ), replaceString);
};

/**
 * Returns an object wrapping the query string.
 */
sm.getQueryString = function() {
    return SenseURL.getQueryStringFromSearch(window.location.search);
};

/**
 * Returns the data uri for the svg node.
 */
sm.getURI = function(el, w, h) {
    function styles(el) {
        var css = '',
            sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i++) {
            var rules = sheets[i].cssRules;

            if (rules !== null) {
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (typeof(rule.style) !== 'undefined') {
                        var matches = el.querySelectorAll(rule.selectorText);
                        if (matches.length > 0) {
                            css += rule.selectorText + ' { ' + rule.style.cssText + ' }\n';
                        }
                    }
                }
            }
        }

        return css;
    }

    var xmlns = 'http://www.w3.org/2000/xmlns/';
    var doctype = '<?xml version="1.0" standalone="no"?>';
    var outer = document.createElement('div');
    var clone = el.cloneNode(true);

    clone.setAttribute('version', '1.1');
    clone.setAttributeNS(xmlns, 'xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttributeNS(xmlns, 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
    clone.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    outer.appendChild(clone);

    var css = styles(el);
    var s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    s.innerHTML = '<![CDATA[\n' + css + '\n]]>';
    var defs = document.createElement('defs');
    defs.appendChild(s);
    clone.insertBefore(defs, clone.firstChild);

    var svg = doctype + outer.innerHTML;
    var uri = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));

    return uri;
};

/**
 * Submits a finding to the reasoning server.
 */
sm.submitFinding = function(finding) {
    $.ajax({
        url: sm.host + 'findings',
        type: 'POST',
        data: finding
    });
};

/**
 * Gets the title of the given url and excute the callback.
 */
sm.fetchPageTitle = function(url, callback) {
    var title;

    $.ajax({
        url: url,
        timeout: 2000
    }).done(function(html) {
        try {
            var re = /<title>(.*)<\/title>/;
            var result = html.match(re);
            if (result) {
                title = result[1];
            }
        } catch (e) {
        }
    }).always(function() {
        if (callback) {
            callback(title);
        }
    });
};

/**
 * Periodically check if all images are loaded. If yes, invoke the given callback.
 */
sm.checkImagesLoaded = function(nodes, callback) {
    var maxIterations = 10; // Max number of times checking images to prevent waiting too long
    var id = setInterval(function() {
        maxIterations--;
        var loaded = true;
        nodes.each(function() {
            var img = d3.select(this).select('img');
            if (img.attr('src') && img.style('width') === '0px') {
                loaded = false;
            }
        });

        if (loaded || !maxIterations) {
            // Stop checking
            clearInterval(id);
            callback();
        }
    }, 100);
};

/*
 * Finds where a line starting at point ({x, y}) would intersect a rectangle ({x, y, width, height})
 * if it were pointing at the rectangle's center.
 */
sm.getRectEdgePoint = function(rect, point) {
    var w = rect.width / 2,
        h = rect.height / 2,
        x = rect.x + w,
        y = rect.y + h,
        dx = point.x - x,
        dy = point.y - y;

    // The point is exactly the rectangle's center
    if (!dx && !dy) {
        throw new Error('Not possible to find intersection inside of the rectangle');
    }

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

    return {x: x + sx, y: y + sy};
};
