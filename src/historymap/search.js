var hmIndex;

const initializeSearchIndex = (pages) => {
  hmIndex = new FlexSearch.Document({
    id: 'pageId',
    index: [
      'pageObj:title',
      'pageObj:url',
      'tags',
      'note',
      'highlights'
    ],
    tokenize: 'forward',
  })

  pages.forEach(page => {
    hmIndex.add(page)
  })
}

const updateSearchIndex = (page) => {
  hmIndex.update(page)
}

const addPageToSearchIndex = (page) => {
  hmIndex.add(page)
}

document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('search-box')
  searchInput.addEventListener('input', function (e) {
    const query = e.target.value
    if (query.length === 0) {
      visibleIndex = Math.max(0, hmPages.length - cntInitVisibleNodes);
      displayTree(hmPages);
      return
    } else {
      const results = hmIndex.search(query)
      const pageIds = [...new Set(results.flatMap(r => r.result))]
      const pages = hmPages.filter(p => pageIds.includes(p.pageId))
      visibleIndex = 0
      displayTree(pages)
    }
  })
})
