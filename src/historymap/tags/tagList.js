const hmTagListView = ({
    container
}) => {
    var module,
        tagList;
    
    function initialize() {
        tagList = u('<div>').addClass('tag-list');
        container.empty();
        container.append(tagList);
    }

    initialize();

    return module = {
        display: () => {
            const dict = hmPages.reduce((acc, p) => {
                if (p.tags) {
                    p.tags.forEach(t => {
                        if (t in acc === false) {
                            acc[t] = 0;
                        }
                        acc[t]++;
                    });
                }
                return acc;
            }, {});
            const tags = Object.keys(dict)
                .map(t => ({ tag: t, count: dict[t] }));

            tagList.empty();
            tagList.append(tag => {
                const item = u('<div>')
                    .addClass('tag')
                    .addClass('flex', 'justify-between', 'cursor-pointer');
                item.append(u('<span>').text(tag.tag));
                item.append(u('<span>').addClass('number').text(tag.count));
                item.on('click', () => {
                    if (!item.hasClass('selected')) {
                        tagList.children().each(c => u(c).removeClass('selected'));
                        item.addClass('selected');
                        const data = hmPages.filter(p => p.tags && p.tags.includes(tag.tag));
                        visibleIndex = 0;
                        displayTree(data);
                    } else {
                        tagList.children().each(c => u(c).removeClass('selected'));
                        visibleIndex = Math.max(0, hmPages.length - cntInitVisibleNodes);
                        displayTree(hmPages);
                    }
                    
                });
                return item;
            }, tags);

            return module;
        }
    }
}
