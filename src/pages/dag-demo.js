$(function() {
    var dataPath = "data/p1.json";
    // dataPath = undefined;
    var data = {
        nodes: [
            { id: "wbhq", label: "World Bank Headquarters", icon: "https://www.google.com/images/branding/product/ico/maps_32dp.ico" },
            { id: "tri", label: "trivagoes - 4 stars hotels", icon: "http://ie2.trivago.com/images/layoutimages/favicon_moon/favicon_16x16.ico" },
            { id: "hyatt", label: "Grand Hyatt", icon: "http://grandwashington.hyatt.com/favicon.ico", candidate: true },
            { id: "hyatt-loc", label: "Grand Hyatt location", icon: "https://www.google.com/images/branding/product/ico/maps_32dp.ico" },
            { id: "inn", label: "River Inn hotel", icon: "http://www.theriverinn.com/favicon.ico", candidate: true },
            { id: "inn-loc", label: "River Inn location", icon: "https://www.google.com/images/branding/product/ico/maps_32dp.ico" },
            { id: "inn-note", label: "crappy gym", icon: "http://www.7ideas.com/static/img/favicon.ico"},
            { id: "booking", label: "booking.com", icon: "http://q-ec.bstatic.com/static/img/b25logo/favicon/ebc77706da3aae4aee7b05dadf182390f0d26d11.ico" },
            { id: "hyatt-price", label: "so expensive", icon: "http://q-ec.bstatic.com/static/img/b25logo/favicon/ebc77706da3aae4aee7b05dadf182390f0d26d11.ico" },
            { id: "hyatt-hl", label: "Grand Hyatt Washington", icon: "http://ie2.trivago.com/images/layoutimages/favicon_moon/favicon_16x16.ico" },
            { id: "inn-hl", label: "Galería de \"The River Inn\"", icon: "http://www.7ideas.com/static/img/favicon.ico" },
            { id: "hyatt-hl1", label: "reviews", icon: "https://ssl.gstatic.com/s2/oz/images/faviconr3.ico" },
            { id: "hyatt-hl2", label: "checked in and asked about construction. was told it won't s", icon: "https://ssl.gstatic.com/s2/oz/images/faviconr3.ico" },
            { id: "hyatt-hl3", label: "m. it started at 6 am! and it was loud! I can't believe a hotel brand like the hyatt would do this to their guests. asked for the manager to call and had to call 4 times to get a return call. apologies and offer of a new room. terrible", icon: "https://ssl.gstatic.com/s2/oz/images/faviconr3.ico" },
            { id: "hyatt-hl4", label: "Horrible guest service!!! Stayed last night and I had a $157 Hyatt Gift Card to use towards my stay, when I checked out their system didn't swiped it correctly the front desk person told me not to worry and that t", icon: "https://ssl.gstatic.com/s2/oz/images/faviconr3.ico" },
            { id: "hyatt-hl5", label: "Their accounting service is horrible. My invoice from their hotel was $50 dollars different than that of what is displayed on my bank statement. Customer service is horrible I have been on hold for 30 minutes and counting. I will not stay at a", icon: "https://ssl.gstatic.com/s2/oz/images/faviconr3.ico" },
            { id: "hyatt-hl6", label: "r. Staff was rud", icon: "https://ssl.gstatic.com/s2/oz/images/faviconr3.ico" },
            { id: "hyatt-hl7", label: "re Hyatt Platinum Members and have stayed here before, but were a little disappointed with how understaffed and overworked the working staff were. ", icon: "https://ssl.gstatic.com/s2/oz/images/faviconr3.ico" },
            { id: "hyatt-hl8", label: "on't stay while under construction, very noisy, very smelly, trip hazards everywhere.", icon: "https://ssl.gstatic.com/s2/oz/images/faviconr3.ico" }
        ],
        links: [
            { source: "wbhq", target: "hyatt-loc" },
            { source: "wbhq", target: "inn-loc" },
            { source: "tri", target: "hyatt" },
            { source: "tri", target: "inn" },
            { source: "hyatt", target: "hyatt-loc" },
            { source: "inn", target: "inn-loc" },
            { source: "inn", target: "inn-note" },
            { source: "inn", target: "inn-hl" },
            { source: "booking", target: "hyatt" },
            { source: "tri", target: "hyatt-loc" },
            { source: "hyatt", target: "hyatt-price" },
            { source: "hyatt", target: "hyatt-hl" },
            { source: "hyatt", target: "hyatt-hl1" },
            { source: "hyatt", target: "hyatt-hl2" },
            { source: "hyatt", target: "hyatt-hl3" },
            { source: "hyatt", target: "hyatt-hl4" },
            { source: "hyatt", target: "hyatt-hl5" },
            { source: "hyatt", target: "hyatt-hl6" },
            { source: "hyatt", target: "hyatt-hl7" },
            { source: "hyatt-hl1", target: "hyatt-hl4" },
            { source: "hyatt-hl1", target: "hyatt-hl5" },
            { source: "hyatt-hl2", target: "hyatt-hl6" },
            { source: "hyatt-hl6", target: "hyatt-hl7" },
            { source: "hyatt", target: "hyatt-hl8" }
        ]
    };

    // Instantiate vis
    var dag = sm.vis.sensedag();

    // Update the vis
    var updateVis = function() {
        // Update size of the vis and the container
        var width = $(".sm-dag-demo").width();
        var height = $(".sm-dag-demo").height();
        dag.width(width).height(height);

        redraw();
    };

    // Run first time to build the vis
    if (dataPath) {
        d3.json(dataPath, function(_data) {
            // Nodes
            data.nodes = _data.data.map(function(d) {
                return {
                    id: d.id,
                    label: d.text,
                    icon: d.favIconUrl,
                    time: new Date(d.time),
                    type: d.type,
                    url: d.url,
                    from: d.from
                };
            });

            // Links
            var embeddedTypes = [ "highlight", "note", "filter" ];
            var currentSource = data.nodes[0];
            var addChild = function(p, c) {
                if (!p.children) p.children = [];
                p.children.push(c);
            };

            // - Build parent-child relationship first
            var willRemoveIndices = [];
            data.nodes.forEach(function(d, i) {
                if (!i) return;

                // Add page linking as a type of link
                if (d.type === 'link') {
                    // If empty link ('from' is undefined), use the previous item as the parent
                    addChild(d.from ? (data.nodes.find(d2 => d2.id === d.from) || currentSource) : currentSource, d);
                }

                // If the action type of an item is embedded, add it as a child of the containing page
                if (embeddedTypes.includes(d.type)) {
                    addChild(currentSource, d);
                } else {
                    currentSource = d;
                }

                // If the action type is 'revisit', remove it so that it's only shown once.
                // Also, if there're any embedded actions after that, set their parent to the item it's revisited.
                if (d.type === 'revisit') {
                    for (var j = 0; j < i; j++) { // The revisited item is the first one having the same url
                        if (data.nodes[j].url === d.url) {
                            willRemoveIndices.push(i);
                            currentSource = data.nodes[j];
                            break;
                        }
                    }
                }
            });

            // - Remove revisited items
            willRemoveIndices.reverse().forEach(function(i) {
                data.nodes.splice(i, 1);
            });

            // - This data yields overlap
            // data.nodes.splice(0, 4);
            // data.nodes.splice(3, 1);
            // data.nodes.splice(5, 1);
            // data.nodes.splice(6, 1);
            // data.nodes.splice(9);

            // this has 3 classes
            // data.nodes.splice(13);

            // data.nodes.splice(0, 4);
            // data.nodes.splice(3, 1);
            // data.nodes.splice(5, 1);
            // data.nodes.splice(16);

            data.nodes.splice(33);

            // data.nodes.forEach((n, i) => {
            //     console.log(i + '\t' + n.label);
            // });

            // - Then add to the link list
            data.links = [];
            data.nodes.forEach(function(d) {
                if (d.children) {
                    d.children.forEach(function(c) {
                        if (data.nodes.includes(c)) data.links.push({ source: d, target: c });
                    });
                }
            });

            updateVis();
        });
    } else {
        // Convert source and target of links to nodes rather ids
        var dict = {};
        data.nodes.forEach(n => {
            dict[n.id] = n;
        });
        data.links.forEach(l => {
            l.source = dict[l.source];
            l.target = dict[l.target];
        });

        updateVis();
    }

    // Rebuild vis when the window is resized
    var id;
    $(window).resize(function() {
        clearTimeout(id);
        id = setTimeout(updateVis, 100);
    });

    function redraw() {
        d3.select(".sm-dag-demo").datum(data).call(dag);
    }
});