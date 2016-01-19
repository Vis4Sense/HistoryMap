document.addEventListener('DOMContentLoaded', function () {
    // Apply saved settings
    chrome.storage.sync.get(null, function(items) {
        if (!items.sensemapMode) {
            items.sensemapMode = 'capture';
        }
        var radios = document.querySelectorAll("input[type='radio']");
        for (var i = 0; i < radios.length; i++) {
            radios[i].checked = radios[i].value === items.sensemapMode;
        };
    });

    // Save settings
    var radios = document.querySelectorAll("input[type='radio']");
    for (var i = 0; i < radios.length; i++) {
        radios[i].addEventListener('click', function() {
            chrome.storage.sync.set({ sensemapMode: this.value });
        });
    }
});