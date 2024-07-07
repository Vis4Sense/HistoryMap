
function hmTreeNode(hmPage) {
    var module,
        node,
        nodeData;

    function hmPage2nodeData() {
        nodeData = {
            id: hmPage.pageId,
            isOpened: hmPage.isOpened,
            isVisible: hmPage.isVisible,
            data: hmPage,
            parentPageId: hmPage.parentPageId,
            title: hmPage.pageObj.title,
            favIconUrl: hmPage.pageObj.favIconUrl,
            highlights: hmPage.highlights,
            tags: hmPage.tags,
            note: hmPage.note,
            isLeaf: hmPage.isLeaf,
            isCollapsed: hmPage.isCollapsed,
            isDescendantOpened: hmPage.isDescendantOpened,
        }
    }

    function initialize() {
        hmPage2nodeData();
    }

    /**
     * Append header to the node
     * 
     * <div class="item-header">
     *   <img src="faviconUrl">
     *   <span>title</span>
     * </div>
     */
    function appendHeader() {
        const header = node
            .append('xhtml:div')
            .attr('class', 'item-header');

        header
            .filter(d => !d.isLeaf)
            .append('xhtml:img')
            .attr('class', 'icon-collapse')
            .attr('src', d => d.isCollapsed
                ? utils.iconUrl('arrow-right')
                : utils.iconUrl('arrow-down')
            );

        header
            .append('xhtml:img')
            .attr('src', d => d.favIconUrl || utils.iconUrl('question-circle'));

        header
            .append('xhtml:span')
            .text(d => d.title);
    }

    /**
     * Append notes to the node
     */
    function appendNote(force = false) {
        const note = node
            .filter(d => d.note !== null || force)
            .append('xhtml:div')
            .attr('class', 'item-note')
            .attr('contenteditable', 'true')
            .text(d => d.note || 'Add note...')
            .classed('placeholder', d => !d.note)
            .on('focus', function (e, d) {
                if (!d.isRaising) {
                    d.isRaising = true;
                    d3.select(`#hmtree-node-${d.id}`).raise();
                }
                if (!d.note) {
                    e.target.innerText = '';
                    e.target.classList.remove('placeholder');
                }
            })
            .on('blur', function (e, d) {
                if (d.isRaising) {
                    setTimeout(() => {
                        e.target.focus();
                        d.isRaising = false;
                    }, 0);
                } else {
                    const newNote = e.target.innerText || null;
                    handleNoteChange(d.id, newNote);
                }
            })
    }

    /**
     * Append tag input
     */
    function appendTagInput(force = false) {
        const data = node.datum();
        const userTags = data.tags.filter(d => d[0] !== '/')
        if (userTags.length === 0 && !force) return;
        const tagInput = node.append('xhtml:input');
        const tagify = new Tagify(tagInput.node(), {
            // show suggestions
            whitelist : getAllTags().filter(d => d[0] !== '/'),
            dropdown : {
                classname     : "color-blue",
                enabled       : 1,
                maxItems      : 5,
                position      : "text",
                closeOnSelect : false,
                highlightFirst: true
            }
        });
        tagify.addTags(userTags);
        const input = tagify.DOM.input;
        d3.select(input)
            .datum(data)
            .on('focus', function (e, d) {
                d.isRaising = true;
                raise();
                setTimeout(() => {
                    this.focus();
                    d.isRaising = false;
                }, 0);
            })
            .on('blur', function (e, d) {
                if (!d.isRaising) {
                    const newTags = tagify.value.map(t => t.value);
                    handleTagChange(d.id, newTags);
                }
            });
        tagify.on('remove', () => {
            setTimeout(() => {
                const newTags = tagify.value.map(t => t.value);
                handleTagChange(data.id, newTags);
            }, 0);
        });
    }

    /**
     * Append highlights to the node
     * 
     * <div class="item-highlights">
     *   <div class="item-highlight">
     *     <div class="icon-brush"></div>
     *     <div class="item-highlight-text ellipsis">highlighted text</div>
     *   </div>
     * </div>
     */
    function appendHighlights() {
        const highlights = node
            .filter(d => d.highlights.length > 0)
            .append('xhtml:div')
            .attr('class', 'item-highlights');

        highlights
            .selectAll('.item-highlight')
            .data(d => d.highlights)
            .join('xhtml:div')
            .attr('class', 'item-highlight')
            .call(appendHighlight);

        function appendHighlight(selection) {
            selection.append('xhtml:div')
                .attr('class', 'icon-brush')
                .append('xhtml:img')
                .attr('class', 'icon')
                .attr('src', utils.iconUrl('brush-fill'));
            selection.append('xhtml:div')
                .attr('class', 'item-highlight-text ellipsis')
                .text(d => d.text);
        }
    }

    /**
     * Raise node
     */
    function raise() {
        node.each((d) => {
            d3.select(`#hmtree-node-${d.id}`).raise();
        })
    }

    initialize();

    return module = {
        node: function () {
            return node.node();
        },

        init: function (node_) {
            node = node_;
            node.datum(nodeData);

            node.classed('hm-tree-node', true);
            node.classed('closed', !nodeData.isOpened);
            node.classed('semi-closed', d =>
                d.isCollapsed
                && !d.isOpened
                && d.isDescendantOpened
            );
            node.classed('favorite', d => d.tags.includes('/favorite'));
            node.classed('visible', d => d.isVisible);

            if (nodeData.tags.includes('/minimize')) {
                node.classed('minimized', true);
            } else {
                node.classed('item-contents-display', true);
                node.classed('boxed-item', true);

                appendHeader();
                // appendNote();
                appendTagInput();
                appendHighlights();
            }
        },

        toggleFav: function (isFav) {
            node.classed('favorite', isFav);
        },

        // openNote: function () {
        //     // if note is not displayed, display it
        //     if (!node.select('.item-note').node()) {
        //         appendNote(force=true);
        //         handleNoteChange(nodeData.id, '');
        //     }
        //     node.select('.item-note').node().focus();
        //     raise();
        // },

        openTagInput: function () {
            if (!node.select('input').node()) {
                appendTagInput(force=true);
            }
            raise();
        },
    }
}
