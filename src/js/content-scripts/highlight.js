/**
 * Highlights the given selection and returns the serialized path of the selection.
 */
$.highlight = function(selection, classId, noteWrap) {
    if (!selection || selection.type !== "Range") return null;

    // Highlight node somehow changes the current selection, needs to serialize first
    var path = serializeSelection(selection);

    // Selection can cover multiple nodes. Range object only provides the start and end node.
    // We need to start highlighting at the root (lowest common ancestor), traverse the tree to highlight each node.
    var range = selection.getRangeAt(0);
    var text = selection.toString();

    if (!classId) classId = 'sm-' + (+new Date());

    highlightNode(selection, range, classId, range.commonAncestorContainer, range.startContainer, range.endContainer, noteWrap);

    if (noteWrap) {
        noteWrap.path = path;
        noteWrap.highlight = text;
        noteWrap.classId = classId;
    }

    return noteWrap || { path: path, text: text, classId: classId };
};

/**
 * Highlights a DOM element.
 */
$.highlightElement = function(element) {
    // Create a selection then highlight it
    var range = document.createRange();
    range.setStart(element, 0);
    range.setEnd(element, element.childNodes.length);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    var classId = "sm-" + (+new Date());
    var h = $.highlight(selection, classId);
    h.classId = classId;
    selection.empty();

    return h;
};

function isSelectionBackward(selection) {
    var range = document.createRange();
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    var backwards = range.collapsed;
    range.detach();

    return backwards;
}

function highlightNode(selection, range, classId, currentNode, startNode, endNode, noteWrap) {
    if (!currentNode) return;

    // DFS: Process itself
    if (selection.containsNode(currentNode, true) && currentNode.nodeName === "#text") {
        var startOffset = currentNode === startNode ? range.startOffset : -1;
        var endOffset = currentNode === endNode ? range.endOffset : -1;
        highlighTextNode(currentNode, classId, startOffset, endOffset, noteWrap && currentNode === endNode ? noteWrap : undefined);
    }

    // Not really know why need it? But it doesn't work when highlighting entire node (endNode === currentNode)
    // if (currentNode === endNode) return;

    // Then, go for its children
    for (var i = 0; i < currentNode.childNodes.length; i++) {
        highlightNode(selection, range, classId, currentNode.childNodes[i], startNode, endNode, noteWrap);
    }
}

function highlighTextNode(node, classId, startOffset, endOffset, noteWrap) {
    // Ignore white-space text
    var text = node.nodeValue;
    if (text.trim() === "") return;

    if (node.parentNode.nodeName.toLowerCase() === "mark") return; // Somehow the first text got highlighted twice, dont know why, bad way to ignore.

    // Normal text at the beginning
    if (startOffset !== -1) {
        node.parentNode.insertBefore(document.createTextNode(text.substring(0, startOffset)), node);
    }

    // Span node to indicate a note
    var noteNode;
    if (noteWrap) {
        noteNode = document.createElement("img");
        var id = noteWrap.id || "img-" + (+new Date());
        noteNode.setAttribute("id", id);
        noteWrap.id = id;
        noteNode.src = chrome.extension.getURL("src/css/fa-edit.png");
        noteNode.setAttribute("title", noteWrap.text);
        noteNode.classList.add("sm-note-icon");
        noteNode.classList.add(classId);
        node.parentNode.insertBefore(noteNode, node.nextSibling);
    }

    // An mark node surrounding highlight text
    var markNode = document.createElement("mark");
    markNode.classList.add("sm-note");
    markNode.classList.add(classId);
    markNode.appendChild(document.createTextNode(text.substring(startOffset, endOffset === -1 ? text.length : endOffset)));
    node.parentNode.insertBefore(markNode, node.nextSibling);

    // Actions for highlight. Weird: cannot bind 'click' event, need to do through hover
    $(markNode).hover(function(e) {
        $(this).unbind("click").click(function(e) {
            var buttons = $(".sm-highlight-buttons");
            if (!buttons.length) {
                buttons = $("<div class='sm-highlight-buttons sm-btn-group'></div>").appendTo(markNode).css({ position: "fixed" });
                $("<button class='sm-btn sm-btn-default' style='opacity: 0.8'>Remove</button>").appendTo(buttons)
                    .click(function(e) {
                        // Remove image
                        var imgNode = markNode.parentNode.querySelector(".sm-note-icon");
                        if (imgNode) {
                            imgNode.parentNode.removeChild(imgNode);
                        }

                        // Remove highlight by replacing 'mark' node with 'text' node
                        $("." + classId).each(function() {
                            // 'Remove' appended to the end of the node because button is added into markNode. Get only text node.
                            var texts = $(this).contents().filter(function() { return this.nodeType === 3; });
                            if (texts.length) {
                                this.parentNode.insertBefore(document.createTextNode(texts[0].textContent), this);
                                this.parentNode.removeChild(this);
                            }
                        });

                        e.preventDefault(); // Prevent default behavior like link
                        e.stopPropagation(); // Prevent another click onto mark node
                        $(".sm-highlight-buttons").remove();

                        // Tell the extension
                        chrome.runtime.sendMessage({ type: "highlightRemoved", classId: classId });
                    });

                if (noteWrap) {
                    $("<button class='sm-btn sm-btn-default style='opacity: 0.8'>Edit</button>").appendTo(buttons)
                        .click(function(e) {
                            $.openNote(e.clientX, e.clientY, noteWrap);
                            e.preventDefault();
                            e.stopPropagation();
                            $(".sm-highlight-buttons").remove();
                        });
                } else {
                    $("<button class='sm-btn sm-btn-default' style='opacity: 0.8'>Add Note</button>").appendTo(buttons)
                        .click(function(e) {
                            $("." + classId).last().each(function() {
                                noteNode = document.createElement("img");
                                var id = "img-" + (+new Date());
                                noteNode.setAttribute("id", id);
                                noteWrap = { id: id, classId: classId };
                                noteNode.src = chrome.extension.getURL("src/css/fa-edit.png");
                                noteNode.classList.add("sm-note-icon");
                                noteNode.classList.add(classId);
                                this.parentNode.insertBefore(noteNode, this.nextSibling);

                                $.openNote(e.clientX, e.clientY, noteWrap);
                            });

                            e.preventDefault();
                            e.stopPropagation();
                            $(".sm-highlight-buttons").remove();
                        });
                }
            }

            buttons.css({ left: e.clientX - 60, top: e.clientY });
        });
    }, function() {
        $(".sm-highlight-buttons").remove();
    });

    // Normal text at the end
    if (endOffset !== -1) {
        node.parentNode.insertBefore(document.createTextNode(text.substring(endOffset)), noteNode ? noteNode.nextSibling : markNode.nextSibling);
    }

    // Remove original text node
    node.parentNode.removeChild(node);
}

// http://home.arcor.de/martin.honnen/javascript/storingSelection1.html
// Restore selection based on the path lead to the capture node. Only works with static pages.
// Run it at two different time points may result different paths --> should run only once and pass the value around.
function serializeSelection(selection) {
    function makeXPath (node, currentPath) {
        /* this should suffice in HTML documents for selectable nodes, XML with namespaces needs more code */
        currentPath = currentPath || '';
        switch (node.nodeType) {
            case 3:
            case 4:
                return makeXPath(node.parentNode, 'text()[' + (document.evaluate('preceding-sibling::text()', node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']');
            case 1:
                return makeXPath(node.parentNode, node.nodeName + '[' + (document.evaluate('preceding-sibling::' + node.nodeName, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']' + (currentPath ? '/' + currentPath : ''));
            case 9:
                return '/' + currentPath;
            default:
                return '';
        }
    }

    var range = selection.getRangeAt(0);
    if (range) return makeXPath(range.startContainer) + '|' + range.startOffset + '|' + makeXPath(range.endContainer) + '|' + range.endOffset;

    return "";
}

$.getXPath = function(node, currentPath) {
    currentPath = currentPath || '';
    switch (node.nodeType) {
        case 3:
        case 4:
            return $.getXPath(node.parentNode, 'text()[' + (document.evaluate('preceding-sibling::text()', node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']');
        case 1:
            return $.getXPath(node.parentNode, node.nodeName + '[' + (document.evaluate('preceding-sibling::' + node.nodeName, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']' + (currentPath ? '/' + currentPath : ''));
        case 9:
            return '/' + currentPath;
        default:
            return '';
    }
};

/**
 * Highlights the given x-path. The path should be generated by sm.highlight method.
 */
$.highlightPath = function(path, classId, noteWrap) {
    // The 'highlight' method needs to use the 'selection' object to check node containment. So, it needs to cancel the current selection.
    var selection = getSelection();
    selection.removeAllRanges();
    var range = document.createRange();
    path = path.split(/\|/g);

    try {
        range.setStart(document.evaluate(path[0], document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, Number(path[1]));
        range.setEnd(document.evaluate(path[2], document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, Number(path[3]));
        selection.addRange(range);
        var t = selection.toString();
        highlightNode(selection, range, classId, range.commonAncestorContainer, range.startContainer, range.endContainer, noteWrap);

        selection.empty();
        return t;
    } catch (e) {
        console.log("Failed to restore previous highlighted text.");
        console.log(e);
        console.log(path);
    }
};

/**
 * Shows note dialog.
 */
$.openNote = function(x, y, noteWrap) {
    var dialog = $("<div class='sm-modal fade' tabindex='-1'></div>").appendTo("body");
    var content = $("<div class='sm-modal-content'></div>").appendTo($("<div class='sm-modal-dialog sm-modal-sm'></div>").appendTo(dialog));
    var body = "<textarea rows=5 autofocus style='width: 100%' />";
    content.append("<div class='sm-modal-body'><div>" + body + "</div>");

    // Load existing note
    content.find("textarea").val(noteWrap.text);

    var footer = $("<div class='sm-modal-footer'></div>").appendTo(content);
    footer.append("<button id='btnSaveNote' class='sm-btn sm-btn-primary'>Save</button><button id='btnCancelNote' class='sm-btn sm-btn-default'>Cancel</button>");
    footer.find("#btnSaveNote").click(function() {
        // Tell the extension
        var note = dialog.find("textarea").val();
        $("#" + noteWrap.id).attr("title", note);
        noteWrap.text = note;

        dialog.modal("hide");

        chrome.runtime.sendMessage({ type: "noted", data: noteWrap });
    });
    footer.find("#btnCancelNote").click(function() {
        dialog.modal("hide");
    });

    dialog.modal().on('shown.bs.modal', function() {
        dialog.find("textarea").focus();
    });
    dialog.find(".sm-modal-dialog").css({ position: "fixed", left: x, top: y, margin: 0 });

    dialog.find(".sm-modal-content").draggable();
};