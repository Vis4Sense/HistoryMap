/**
 * It's a small transaction system which is used when a new tab is created and
 * the system waits end of full loading of the page
 *
 * Created by steve on 9/26/16.
 */
class SenseTransaction {
    /**
     * Create transaction system
     *
     * @param {Object} [options]
     */
    constructor(options) {
        this.options = options || {};
        this.transactions = [];
    }
    /**
     * Look up the transaction by src or dst field and return a number if found or -1
     *
     * @param {Object} tab
     * @param {Boolean} isBySrc
     * @returns {Number}
     */
    lookup(tab, isBySrc) {
        var tabId = tab.id ? tab.id : tab.tabId,
            foundId = this.transactions.findIndex(tr => {
                var field = isBySrc ? tr.src : tr.dst;
                return field.url == tab.url
                    && field.tabId == tabId
                    && field.windowId == tab.windowId;
            });
        // Lookup using only tabId and windowId if the search was unsuccessful
        // and it will be using info from the destination tab
        if (foundId < 0 && !isBySrc) {
            foundId = this.transactions.findIndex(tr => tr.dst.tabId == tabId && tr.dst.windowId == tab.windowId);
        }
        return foundId;
    }
    /**
     * Start a transaction by saving information about srcTab, dstTab and srcNode. The transaction will be ended
     * when the system knows dstNode
     *
     * @param {Object} srcTab
     * @param {Object} dstTab
     * @param {SenseNode} srcNode
     * @returns {Number}
     */
    start(srcTab, dstTab, srcNode) {
        var srcTabId = srcTab.id ? srcTab.id : srcTab.tabId,
            dstTabId = dstTab.id ? dstTab.id : dstTab.tabId,
            transaction = {
                id: Date.now(),
                src: {url: srcTab.url, tabId: srcTabId, windowId: srcTab.windowId, node: srcNode},
                dst: {url: dstTab.url, tabId: dstTabId, windowId: dstTab.windowId}
            },
            trId;
        // Clean the old transactions
        if (this.cleanupExpired()) {
            console.warn('Some transactions were removed');
        }
        // Look for an existing transaction at the destination tab
        trId = this.lookup(dstTab, false);
        // If the transaction is found
        if (trId >= 0) {
            transaction.id = this.transactions[trId].id;
        } else {
            // Add a new transaction
            this.transactions.push(transaction);
        }
        return transaction.id;
    }
    /**
     * Finish the transaction, call the callback function if it's presented and remove the transaction from the system
     *
     * @param {SenseNode} dstNode
     * @param {Function} [callback](srcNode)
     * @returns {Boolean} true if it's found
     */
    finish(dstNode, callback) {
        var trId = this.lookup({
                url: dstNode.url, id: dstNode.tabId, windowId: dstNode.windowId
            }, false), isFound = trId >= 0;
        if (isFound) {
            let transaction = this.transactions[trId];
            if (typeof callback == 'function') {
                callback(transaction.src.node);
            }
            // Remove the transaction
            this.transactions.splice(trId, 1);
        }
        return isFound;
    }
    /**
     * Clean all the transactions which have the particular tabId and windowId
     *
     * @param {{tabId: Number, windowId: Number}} searchInfo
     * @return {Boolean} - if size of the of the transactions' array became lower
     */
    cleanup(searchInfo) {
        var oldLength = this.transactions.length;
        this.transactions = this.transactions.filter(tr =>
            !(tr.tabId == searchInfo.tabId && tr.windowId == searchInfo.windowId)
        );
        return this.transactions.length > oldLength;
    }
    /**
     * Clean all the transactions which have expired time
     *
     * @return {Boolean} - if size of the of the transactions' array became lower
     */
    cleanupExpired() {
        const EXPIRED_TIME = 300000;
        var dateNow = Date.now(), oldLength = this.transactions.length;
        this.transactions = this.transactions.filter(tr =>
            dateNow - tr.id < EXPIRED_TIME
        );
        return this.transactions.length > oldLength;
    }
    /**
     * Get source node from the transaction
     *
     * @param {Number} trId
     * @return {SenseNode}
     */
    getSrcNode(trId) {
        var node;
        if (trId >= 0) {
            node = this.transactions[trId].src.node;
        }
        return node;
    }
    /**
     * Make dump of the current state of all the transactions
     *
     * @returns {string}
     */
    dumpTransactionSystem() {
        var answer = this.transactions.length + ':',
            list;
        list = this.transactions.map(el => {
            return {
                id: el.id,
                src: {url: el.src.url, tabId: el.src.tabId, windowId: el.src.windowId, nodeId: el.src.node.id},
                dst: {url: el.dst.url, tabId: el.dst.tabId, windowId: el.dst.windowId}
            };
        });
        return answer + JSON.stringify(list);
    }
}
