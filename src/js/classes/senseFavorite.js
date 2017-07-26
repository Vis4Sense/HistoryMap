/**
 * The main purpose of the class SenseFavorite is to provide a package of the methods which stores and removes and
 * adds the favorite nodes by batching into the Knowledge map.
 * This class also controls the button btnAddStarred which is got when the constructor is launched
 *
 * Created by Steve on 13.10.2016.
 */
class SenseFavorite {
    /**
     * Create and initialize the instance SenseFavorite and save the handler to process a click of the btnAddStarred
     *
     * @param {String} btnAddStarred
     * @param {{firefoxSnapshot: Boolean}} [options]
     * @param {Function} handler
     */
    constructor(btnAddStarred, options, handler) {
        this.nodes = [];
        this.btn = false;
        this.options = options || {};
        this.buttonName = d3 && typeof handler == 'function' && btnAddStarred;
        if (this.buttonName) {
            this.btnAddStarred = d3.select(btnAddStarred);
            this.btnAddStarred.on('click', handler);
            this.switchBtn(false);
        }
    }
    /**
     * Check if the array of favorites is ready to add into the Knowledge Map
     *
     * @returns {Boolean}
     */
    isReady() {
        return this.nodes.length > 0;
    }
    /**
     * Check if the node is already exist in this.nodes
     *
     * @param {SenseNode} node
     * @returns {Boolean}
     */
    isExist(node) {
        return this.nodes.findIndex(n => n.id == node.id) < 0;
    }
    /**
     * Add or Delete the node to/from favorites.
     * Note: It uses the option firefoxSnapshot when adding a node.
     *
     * @param {SenseNode} node
     * @param {Function} [callback]
     */
    process(node, callback) {
        var senseFavorite = this, isCallback = typeof callback == 'function';
        // Try to get a new snapshot when adding to favorites
        if (node.favorite) {
            let result = this.del(node);
            if (isCallback) {
                callback(result);
            }
        } else if (this.options.firefoxSnapshot) {
            if (node.windowId) {
                takeNonStandardSnapshot(node.windowId);
            } else {
                chrome.tabs.query({active: true}, tabs => {
                    let result = !!tabs.length;
                    if (result) {
                        takeNonStandardSnapshot(tabs[0].windowId);
                    } else if (isCallback) {
                        callback(result);
                    }
                });
            }
        } else {
            let result = node.seen && senseFavorite.add(node);
            if (isCallback) {
                callback(result);
            }
        }
        function takeNonStandardSnapshot(windowId) {
            node.takeSnapShot(windowId, {nonStandardCapture: true}, isUpdated => {
                senseFavorite.add(node);
                if (isCallback) {
                    callback(isUpdated);
                }
            });
        }
    }
    /**
     * Add a node into this.nodes
     *
     * @param {SenseNode} node
     * @returns {Boolean} true if added
     */
    add(node) {
        var result = node instanceof SenseNode && this.isExist(node);
        node.favorite = true;
        if (result) {
            this.nodes.push(node);
        }
        // Allow to use the button btnAddStarred
        if (this.nodes.length == 1) {
            this.switchBtn(true);
        }
        return result;
    }
    /**
     * Remove the node from this.nodes if it's already exist here
     *
     * @param {SenseNode} node
     */
    del(node) {
        var idx = this.nodes.findIndex(n => n.id == node.id);
        node.favorite = false;
        if (idx >= 0) {
            this.nodes.splice(idx, 1);
        }
        // Disallow to use the button btnAddStarred
        if (this.nodes.length == 0) {
            this.switchBtn(false);
        }
    }
    /**
     * Return the button label depends from the status
     *
     * @param {Object} node
     * @returns {String} label
     */
    btnTitle(node) {
        return node.favorite ? 'Dislike' : 'Favorite';
    }
    /**
     * Return the button color depends from the status
     *
     * @param {Object} node
     * @returns {String} color
     */
    btnColor(node) {
        return node.favorite ? '#f39c12' : 'black';
    }
    /**
     * Enable/Disable the button btnAddStarred
     *
     * @param {Boolean} mode
     */
    switchBtn(mode) {
        if (typeof mode == 'boolean') {
            this.btn = mode;
            if (this.buttonName) {
                this.btnAddStarred.classed('disabled', !mode);
            }
        } else {
            this.btn = !this.btn;
            if (this.buttonName) {
                this.btnAddStarred.classed('disabled', this.btn);
            }
        }
    }
}
