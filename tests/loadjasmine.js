// source: https://gist.github.com/stevenqzhang/333fd0b2bca201aabaa40c7b63a74296

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("loadjasmine").addEventListener('click', loadJasmine);
});

function loadJasmine() {
  console.log("Loading Jasmine...");
  var jasmineEnv = jasmine.getEnv();
      jasmineEnv.updateInterval = 1000;

      var htmlReporter = new jasmine.HtmlReporter();

      jasmineEnv.addReporter(htmlReporter);

      jasmineEnv.specFilter = function(spec) {
        return htmlReporter.specFilter(spec);
      };
  function execJasmine() {
        jasmineEnv.execute();
      }
  function runTests() { 
        execJasmine();
      }
  document.getElementById("runtests").addEventListener('click', runTests);
}
