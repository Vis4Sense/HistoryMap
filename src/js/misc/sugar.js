String.prototype.replaceAll = function(str1, str2, ignore)
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

/**
 * Returns an object wrapping the query string.
 */
sm.getQueryString = function() {
    return sm.getQueryStringFromSearch(window.location.search);
};

/**
 * Returns an object wrapping the query string from the search part of a url.
 */
sm.getQueryStringFromSearch = function(s) {
    var params = s.substr(1);

    if (params === "") return null;

    var delim = params.indexOf(';') === -1 ? '&' : ';'; // To support both & and ; but prioritize ;
    params = params.split(delim);
    var result = {};

    params.forEach(function(d) {
        var p = d.split('=');
        if (p.length === 2) {
            result[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
    });

    return result;
}

/**
 * Read the content of the uploaded file.
 */
sm.readUploadedFile = function(e, callback) {
    var f = e.target.files[0];
    if (f) {
        var reader = new FileReader();
        reader.readAsText(f);
        reader.onload = function(e) {
            callback(e.target.result);
        };
    }
};

/**
 * Returns the data uri for the svg node.
 */
sm.getURI = function(el, w, h) {
    function styles(el) {
        var css = "";
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i++) {
            var rules = sheets[i].cssRules;

            if (rules !== null) {
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (typeof(rule.style) !== "undefined") {
                        var matches = el.querySelectorAll(rule.selectorText);
                        if (matches.length > 0) {
                            css += rule.selectorText + " { " + rule.style.cssText + " }\n";
                        }
                    }
                }
            }
        }

        return css;
    }

    var xmlns = "http://www.w3.org/2000/xmlns/";
    var doctype = '<?xml version="1.0" standalone="no"?>';
    var outer = document.createElement("div");
    var clone = el.cloneNode(true);

    clone.setAttribute("version", "1.1");
    clone.setAttributeNS(xmlns, "xmlns", "http://www.w3.org/2000/svg");
    clone.setAttributeNS(xmlns, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    clone.setAttribute("width", w);
    clone.setAttribute("height", h);
    clone.setAttribute("viewBox", "0 0 " + w + " " + h);
    outer.appendChild(clone);

    var css = styles(el);
    var s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    s.innerHTML = "<![CDATA[\n" + css + "\n]]>";
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
        url: sm.host + "findings",
        type: "POST",
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