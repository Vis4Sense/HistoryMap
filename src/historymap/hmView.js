

function list2tree(hmPages) {
   const root = d3.stratify()
      .id(d => d.pageId)
      .parentId(d => d.parentPageId)
      (hmPages)

   console.log('root: ', root);
}