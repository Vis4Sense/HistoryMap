const hmTagBarView = ({
  container
}) => {
  var module;

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

      container.empty();
      container.append(tag => {
        const item = u('<div>')
          .addClass('tag')
          .addClass('cursor-pointer')
          .addClass('flex', 'flex-row', 'gap-1');
        item.append(u('<span>').text(tag.tag));
        item.append(u('<span>').addClass('number').text('(' + tag.count + ')'));
        item.on('click', () => {
          if (!item.hasClass('selected')) {
            container.children().each(c => u(c).removeClass('selected'));
            item.addClass('selected');
            const data = hmPages.filter(p => p.tags && p.tags.includes(tag.tag));
            visibleIndex = 0;
            displayTree(data);
          } else {
            container.children().each(c => u(c).removeClass('selected'));
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

const tagBarView = hmTagBarView({ container: u('#tag-bar') });
const displayTagBar = () => { tagBarView.display(); };
