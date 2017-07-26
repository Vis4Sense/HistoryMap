/**
 * Created by steve on 9/8/16.
 */
(function() {
    var status = document.getElementById('status'),
        saveButton = document.getElementById('save-options'),
        storage = document.getElementsByName('storage'),
        apiAddress = document.getElementById('api');
    document.addEventListener('DOMContentLoaded', restoreOptions);
    document.querySelectorAll('#options input').forEach(el => {
        el.addEventListener('change', changeOptions);
    });
    saveButton.addEventListener('click', saveOptions);
    saveButton.disabled = true;
    /**
     * Retrieve options from the storage
     */
    function restoreOptions() {
        chrome.storage.sync.get({
            debugHistory: false,
            debugKnowledge: false,
            debugOthers: false,
            testTab: false,
            noSnapshots: false,
            labelGenerator: false,
            autoSave: true,
            firefoxSnapshot: false,
            inSeparatedTab: false,
            markLastNodes: true,
            inventory: false,
            indexedDB: false,
            api: 'http://bigdata.mdx.ac.uk:8080/sensemapext'
        }, function(items) {
            document.getElementById('debugHistory').checked = items.debugHistory;
            document.getElementById('debugKnowledge').checked = items.debugKnowledge;
            document.getElementById('debugOthers').checked = items.debugOthers;
            document.getElementById('testTab').checked = items.testTab;
            document.getElementById('noSnapshots').checked = items.noSnapshots;
            document.getElementById('labelGenerator').checked = items.labelGenerator;
            document.getElementById('autoSave').checked = items.autoSave;
            document.getElementById('firefoxSnapshot').checked = items.firefoxSnapshot;
            document.getElementById('inSeparatedTab').checked = items.inSeparatedTab;
            document.getElementById('markLastNodes').checked = items.markLastNodes;
            document.getElementById('inventory').checked = items.inventory;
            apiAddress.disabled = storage[0].checked = items.indexedDB;
            storage[1].checked = !items.indexedDB;
            document.getElementById('api').value = items.api;
        });
    }
    /**
     * Store options to the storage
     */
    function saveOptions() {
        chrome.storage.sync.set({
            debugHistory: document.getElementById('debugHistory').checked,
            debugKnowledge: document.getElementById('debugKnowledge').checked,
            debugOthers: document.getElementById('debugOthers').checked,
            testTab: document.getElementById('testTab').checked,
            noSnapshots: document.getElementById('noSnapshots').checked,
            labelGenerator: document.getElementById('labelGenerator').checked,
            autoSave: document.getElementById('autoSave').checked,
            firefoxSnapshot: document.getElementById('firefoxSnapshot').checked,
            inSeparatedTab: document.getElementById('inSeparatedTab').checked,
            markLastNodes: document.getElementById('markLastNodes').checked,
            inventory: document.getElementById('inventory').checked,
            indexedDB: storage[0].checked,
            api: document.getElementById('api').value
        }, function() {
            // Update status to let user know options were saved.
            status.textContent = 'Saving the options...';
            saveButton.disabled = true;
            setTimeout(function() {
                status.textContent = 'These options have been already saved';
            }, 350);
        });
    }
    /**
     * Clean status if any checkbox was changed
     */
    function changeOptions(event) {
        status.textContent = '';
        saveButton.disabled = false;
        if (event.target.name == 'storage') {
            apiAddress.disabled = event.target.value == 'indexedDB';
        }
    }
}());
