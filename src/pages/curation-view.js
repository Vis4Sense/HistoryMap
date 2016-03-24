$(function() {
    // Vis and options
    var backgroundPage = chrome.extension.getBackgroundPage(),
        debugging = backgroundPage.debugging,
        closeConfirmation = !debugging,
        curation,
        mod = sm.provenance.mod();

    run();

    function run() {
        respondToContentScript();
        buildVis();
        updateVis();
        initSettings();
    }

    function respondToContentScript() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'redraw') {
                redraw(true);
            } else if (request.type === 'nodeHovered' && request.view !== 'curation') {
                curation.setBrushed(request.value, request.status);
            } else if (request.type === 'toZoomIn') {
                curation.zoomIn();
            } else if (request.type === 'toZoomOut') {
                curation.zoomOut();
            } else if (request.type === 'resetZoom') {
                curation.resetZoom();
            } else if (request.type === 'computeZoom') {
                curation.computeZoomLevel(request.values);
            }
        });
    }

    function initSettings() {
        d3.select('#btnZoomIn').on('click', function() {
            curation.zoomIn();
            redraw(true);
            chrome.runtime.sendMessage({ type: 'zoomedIn' });
        });

        d3.select('#btnZoomOut').on('click', function() {
            curation.zoomOut();
            redraw(true);
            chrome.runtime.sendMessage({ type: 'zoomedOut' });
        });

        // Need confirmation when close/reload curation
        if (closeConfirmation) {
            window.onbeforeunload = function() {
                return "All unsaved data will be gone if you close this window.";
            };
        }

        // d3.select('body').on('mouseover', function() {
        //     chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: true });
        // });
    }

    function buildVis() {
        curation = sm.vis.curation()
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
        var data = backgroundPage.data;
        if (data) d3.select('.sm-curation-container').datum(data).call(curation);

        if (!external) chrome.runtime.sendMessage({ type: 'redraw' });
    }

    function onActionAdded(d) {
        chrome.runtime.sendMessage({ type: 'actionAdded', value: d });
    }

    function onNodeClicked(d) {
        chrome.runtime.sendMessage({ type: 'nodeClicked', value: mod.getCoreData(d) });
    }

    function onLayoutDone(d) {
        chrome.runtime.sendMessage({ type: 'layoutDone', value: d.rp, id: d.id });
    }
});