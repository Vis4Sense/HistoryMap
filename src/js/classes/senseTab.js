/**
 * The class SenseTab is an abstraction to use in the class SenseHistory
 * and store all the info about all the tab in the system
 *
 * Created by Steve on 10.10.2016.
 */
class SenseTab {
    /**
     * Create an instance of the class SenseTab
     *
     * @param {{debug: Boolean, inventory: Boolean}} options
     */
    constructor(options) {
        this.options = options || {};
        this.activeIgnored = [];
        this.clean();
    }
    /**
     * Clean up the instance and do inventory if it's set in the options
     */
    clean() {
        this.tabs = {};
        if (this.options.inventory) {
            this.invTabs();
        }
    }
    /**
     * Calculate a number of the tabs with the same url using an internal collection
     *
     * @param {String} url
     * @returns {Number}
     */
    count(url) {
        var total = 0;
        if (this.tabs[url]) {
            total = this.tabs[url].length;
        }
        return total;
    }
    /**
     * Calculate a real number of the tabs with the url using chrome.tabs.query and store them to this.tabs
     *
     * @param {String} url
     * @param {Function} [callback]
     */
    invCount(url, callback) {
        var senseTabs = this;
        chrome.tabs.query({url: url}, tabs => {
            if (tabs.length > 0) {
                tabs.forEach(tab => { senseTabs.addTab(tab); });
            }
            if (typeof callback == 'function') {
                callback(tabs.length);
            }
        });
    }
    /**
     * Add the tab info to the collection this.tabs
     *
     * @param {Object} tab
     * @returns {Boolean} false if there are some troubles with the tab
     */
    addTab(tab) {
        var info, tabId = tab.id ? tab.id : tab.tabId;
        if (!(tab.url && tabId && tab.windowId)) {
            return false;
        }
        info = {tabId: tabId, windowId: tab.windowId};
        // Check if there are already existed tab
        if (this.tabs[tab.url]) {
            if (this.findIndex(tab.url, info) < 0) {
                this.tabs[tab.url].push(info);
            }
        } else {
            this.tabs[tab.url] = [info];
        }
        // Check if the tab is active ignored tab and involve it
        this.involveIgnored(tab);
        return true;
    }
    /**
     * Get index of the info using url
     *
     * @param {String} url
     * @param {{tabId: Number, windowId: Number}} info
     * @returns {Number} -1 if not found
     */
    findIndex(url, info) {
        var tabId = info.tabId ? info.tabId : tab.id;
        return this.tabs[url].findIndex(tab => tab.tabId == tabId && tab.windowId == info.windowId);
    }
    /**
     * Look up an url using tabId and windowId in this.tabs
     *
     * @param {{tabId: Number, windowId: Number}} info
     * @returns {{url: String, idx: Number|undefined}}
     */
    lookupTabWindow(info) {
        var senseTabs = this, answer = {
            url: Object.keys(this.tabs).find(url => senseTabs.findIndex(url, info) >= 0),
            idx: -1
        };
        if (answer.url) {
            answer.idx = this.findIndex(answer.url, info);
        }
        return answer;
    }
    /**
     * Clean this.tabs up using tabId and windowId
     *
     * @param {{tabId: Number, windowId: Number}} info
     * @param {SenseNode} [node]
     * @returns {Number} a new length of this.tabs[foundUrl]
     */
    rmTab(info, node) {
        var oldTab = this.lookupTabWindow(info), length = 0;
        if (oldTab.idx >= 0) {
            this.tabs[oldTab.url].splice(oldTab.idx, 1);
            length = this.tabs[oldTab.url].length;
        }
        if (node) {
            if (this.tabs[node.url].length) {
                let savedTabs = this.tabs[node.url];
                node.tabId = savedTabs[0].tabId;
                node.windowId = savedTabs[0].windowId;
            } else {
                node.tabId = undefined;
                node.windowId = undefined;
            }
        }
        return length;
    }
    /**
     * Update this instance using tabId and windowId of the current tab with following steps:
     * 1) Find an url and an index in this.tabs using tabId and windowId
     * 2) Clean this.tabs up using the found url and index
     * 3) Add the tab by standard way
     *
     * @param {Object} tab
     * @returns {boolean}
     */
    updTab(tab) {
        var tabId = tab.id ? tab.id : tab.tabId;
        if (!(tab.url && tabId && tab.windowId)) {
            return false;
        }
        this.rmTab({tabId: tabId, windowId: tab.windowId});
        this.addTab(tab);
    }
    /**
     * Build senseTabs.tabs using chrome.tabs.query
     */
    invTabs() {
        var senseTabs = this;
        chrome.tabs.query({}, tabs => {
            tabs.forEach(tab => {
                if (!SenseTab.isIgnored(tab)) {
                    let info = {tabId: tab.id, windowId: tab.windowId};
                    if (senseTabs.tabs[tab.url] && senseTabs.tabs[tab.url].length) {
                        senseTabs.tabs[tab.url].push(info);
                    } else {
                        senseTabs.tabs[tab.url] = [info];
                    }
                }
            });
        });
    }
    /**
     * Check if a tab is older then SenseMap application
     *
     * @param {{tabId: Number, windowId: Number, id: Number|Undefined}} tab
     * @return {Boolean}
     */
    isActiveIgnored(tab) {
        var tabId = tab.id ? tab.id : tab.tabId, result = false;
        if (tabId && tab.windowId) {
            let idx = this.activeIgnored.findIndex(t => t.tabId == tabId && t.windowId == tab.windowId);
            result = idx >= 0;
        }
        return result;
    }
    /**
     * Involve a tab to the SenseMap application
     *
     * @param {Object} tab
     */
    involveIgnored(tab) {
        var tabId = tab.id ? tab.id : tab.tabId;
        if (tabId && tab.windowId) {
            let idx = this.activeIgnored.findIndex(t => t.tabId == tabId && t.windowId == tab.windowId);
            if (idx >= 0) {
                this.activeIgnored.splice(idx, 1);
            }
        }
    }
    /**
     * Check if the current tab is ignored
     *
     * @param {Object} tab
     * @returns {Boolean}
     */
    static isIgnored(tab) {
        var result = false;
        if (tab) {
            result = tab.url && SenseURL.isUrlIgnored(tab.url) || tab.status && tab.status !== 'complete';
        }
        return result;
    }
}
