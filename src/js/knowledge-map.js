window.addEventListener('load', () => {
    // Vis and options
    var backgroundPage = chrome.extension.getBackgroundPage(),
        senseKnowledge = new SenseKnowledge(backgroundPage.options),
        data = backgroundPage.data,
        closeConfirmation = !backgroundPage.options.debugKnowledge,
        curation,
        mod = sm.provenance.mod();

    respondToContentScript();
    buildVis();
    updateVis();
    initSettings();

    function respondToContentScript() {
        chrome.runtime.onMessage.addListener(request => {
            switch (request.type) {
                case 'redraw':
                    redraw(true);
                    break;
                case 'nodeHovered':
                    if (request.view !== 'curation') {
                        curation.setBrushed(request.value, request.status);
                    }
                    break;
                case 'toZoomIn':
                    curation.zoomIn();
                    break;
                case 'toZoomOut':
                    curation.zoomOut();
                    break;
                case 'resetZoom':
                    curation.resetZoom();
                    break;
                case 'computeZoom':
                    curation.computeZoomLevel(request.values);
                    break;
                default:
                    break;
            }
        });
    }

    function initSettings() {
        d3.select('#btnZoomIn').on('click', function() {
            curation.zoomIn();
            redraw(true);
            chrome.runtime.sendMessage({type: 'zoomedIn'});
        });

        d3.select('#btnZoomOut').on('click', function() {
            curation.zoomOut();
            redraw(true);
            chrome.runtime.sendMessage({type: 'zoomedOut'});
        });

        // Need confirmation when close/reload curation
        if (closeConfirmation) {
            window.onbeforeunload = function() {
                return 'All unsaved data will be gone if you close this window.';
            };
        }
        // Switch to History map
        d3.select('#settings').on('click', () => {
            chrome.windows.update(backgroundPage.options.historyMapId, {focused: true});
        });

        // d3.select('body').on('mouseover', function() {
        //     chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: true });
        // });
    }

    function buildVis() {
        curation = sm.vis.curation(senseKnowledge)
            .label(d => d.text)
            .icon(d => d.favIconUrl)
            .on('layoutDone', onLayoutDone);

        mod.view('curation')
            .on('redrawn', redraw)
            .on('actionAdded', onActionAdded)
            .on('nodeClicked', onNodeClicked)
            .handleEvents(curation);

        $(window).resize(_.throttle(updateVis, 200));
    }

    function updateVis() {
        curation.width(window.innerWidth).height(window.innerHeight);
        redraw(true);
    }

    function redraw(external) {
        if (data) {
            d3.select('.sm-curation-container').datum(data).call(curation);
        }

        if (!external) {
            chrome.runtime.sendMessage({type: 'redraw'});
        }
    }

    function onActionAdded(d) {
        chrome.runtime.sendMessage({type: 'actionAdded', value: d});
    }

    function onNodeClicked(d) {
        chrome.runtime.sendMessage({type: 'nodeClicked', value: SenseNode.getCoreData(d)});
    }

    function onLayoutDone(d) {
        chrome.runtime.sendMessage({type: 'layoutDone', value: d.curated, id: d.id});
    }
});
