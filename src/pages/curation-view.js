$(function() {
    // Vis and options
    var curation,
        mod = sm.provenance.mod();

    run();

    function run() {
        // d3.select('body').on('mouseover', function() {
        //     chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: true });
        // });

        respondToContentScript();
        buildVis();
        updateVis();
    }

    function respondToContentScript() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'redraw') {
                redraw(true);
            }
        });
    }

    function buildVis() {
        curation = sm.vis.curation()
            .label(d => d.text)
            .icon(d => d.favIconUrl);

        mod.on('redrawn', redraw)
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
        var data = chrome.extension.getBackgroundPage().data;
        if (data) d3.select('.sm-curation-container').datum(data).call(curation);

        if (!external) chrome.runtime.sendMessage({ type: 'redraw' });
    }

    function onActionAdded(d) {
        chrome.runtime.sendMessage({ type: 'actionAdded', value: d });
    }

    function onNodeClicked(d) {
        chrome.runtime.sendMessage({ type: 'actionAdded', value: d });
    }
});