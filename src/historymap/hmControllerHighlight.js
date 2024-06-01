/**
 * see HistoryMap/old-historymap/src/historyMap/highlightNodes.js
 */


//captures messages from background.js and contextMenu.js to update history map nodes with relevant node data
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "hmHighlightText") {
        addHighlight(
            hmPages,
            request,
            {
                type: "highlightText",
                text: request.text,
                path: request.path,
                classId: request.classId,
            }
        );
    } else if (request.type === "hmHighlightImage") {
        addHighlight(
            hmPages,
            request,
            {
                type: "highlightImage",
                imageSrcUrl: request.imageSrcUrl,
                imageBase64: request.imageBase64,
                imageWidth: request.imageWidth,
                imageHeight: request.imageHeight,
            }
        );
    } else if (request.type === "hmAddPageNote") {
        addPageNote(
            hmPages,
            request.tab,
            request.text
        );
    }

    // find the corresponding hmPage and add the highlight
    function addHighlight(array, request, highlight) {
        const hmPage = array.find((hmPage) => hmPage.tabId === request.tab.id && hmPage.pageObj.url === request.tab.url);

        if (hmPage) {
            // Yuhan: I don't know why click a the context menu will trigger two messages (see contextMenu.js)
            // if the image already exists in highlights, not pushing it again
            if (highlight.type === "highlightImage") {
                const imageExists = hmPage.highlights.find(
                    (highlight) => highlight.imageSrcUrl === request.imageSrcUrl
                );
                if (imageExists) return;
            }

            // add the highlight to the hmPage highlights array
            updatePage(hmPage.pageId, 'addHighlight', { highlight })

            // Yuhan: this will redraw the history map, not sure if a more efficient way is needed
            displayTree(hmPages);
        } else {
            console.error("hmPage not found");
        }
    }

    function addPageNote(array, tab, note) {
        const hmPage = array.find((hmPage) => hmPage.tabId === tab.id && hmPage.pageObj.url === tab.url);
        if (!hmPage) {
            console.error("unimplemented (hm page note): Page not found");

            // TODO: if page is not found, should:
            //   search for the page with the same url but different tabId
            //   if not found, add a new node?

            return;
        }

        updatePage(hmPage.pageId, 'addNote', { note });
        displayTree(hmPages);
    }
});
