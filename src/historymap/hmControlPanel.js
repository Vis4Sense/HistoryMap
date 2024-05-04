document.addEventListener('DOMContentLoaded', function() {
  var optionSelect = document.getElementById('optionSelect');

  // Event listener for the option
  optionSelect.addEventListener('change', function() {
    const layoutMethods = {
      'indented': 'indentedTree',
      'horizontal': 'compactTree',
    }
    treeView.layoutMethod(layoutMethods[this.value]);
    displayTree(hmPages);
  });

});
