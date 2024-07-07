/**
 * @fileoverview Draw menu when hovering on a hmTree node
 */

function hmNodeMenu(node) {
    var menu,
        container;
    
    var menuItems = [
        { title: 'favorite', icon: 'star-fill' },
        { title: 'minimize', icon: 'minus' },
        // { title: 'annotate', icon: 'sticky' },
        { title: 'tag', icon: 'tags' }
    ];

    /**
     * Append menu to the container
     * 
     * <div class="menu-container">
     *   <div class="menu-item">
     *     <img src="iconUrl">
     *   </div>
     *   ...
     * </div>
     */
    menu = function(selection) {
        container = selection.append('foreignObject');

        container.append('xhtml:div')
            .attr('class', 'btn-group');

        const item = container.select('.btn-group')
            .selectAll('button')
            .data(menuItems)
            .join('xhtml:button')
            .on('click', (e, d) => {
                // prevent event bubbling
                e.stopPropagation();
                let nodeData = selection.data()[0];
                if (d.title === 'favorite') {
                    const isFav = !nodeData.tags.includes('/favorite');
                    handleFavoriteNode(nodeData);
                    node.toggleFav(isFav);
                } else if (d.title === 'minimize') {
                    handleMinimizeNode(nodeData);
                } else if (d.title === 'annotate') {
                    // node.openNote();
                } else if (d.title === 'tag') {
                    node.openTagInput();
                }
            });

        item.append('xhtml:img')
            .attr('src', d => utils.iconUrl(d.icon));
    }

    return menu;
}
