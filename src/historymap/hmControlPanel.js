document.addEventListener('DOMContentLoaded', function() {
  var optionSelect = document.getElementById('optionSelect');

  // Event listener for the option
  optionSelect.addEventListener('change', function() {
    const experiences = [
      "./hmTree3View/hmTree3View.html", 
      "./simple_html_tree/simple_tree.html"
    ]
    var iframe = document.getElementById('tree_view');
    iframe.src = experiences[optionSelect.selectedIndex]
  });

});
