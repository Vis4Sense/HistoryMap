/**
 * The class SenseQueue is an abstraction of SenseHistory class
 *
 * Created by steve on 9/6/16.
 */
class SenseQueue {
    /**
     * Create object with empty queue
     */
    constructor() {
        this.queue = [];
    }
    /**
     * Put a node to queue and return a new queue. Length of the queue is always less or equal 4.
     *
     * @param {SenseNode} node
     * @returns {Array}
     */
    putQueue(node) {
        if (node instanceof SenseNode) {
            // calculate length of the queue
            if (this.queue.length > 3) {
                this.queue.pop();
            }
            this.queue.unshift(node);
        }
        return this.queue;
    }
    /**
     * Lookup a node by the url string in queue and return number of array element or -1
     *
     * @param url
     * @returns {number}
     */
    findNodeByURL(url) {
        return this.queue.findIndex(node => node.url === url);
    }
    /**
     * Test node that it is in the queue
     *
     * @param {SenseNode} node
     * @returns {Boolean}
     */
    isInQueue(node) {
        return this.queue.findIndex(n => n.id == node.id) >= 0;
    }
    /**
     * Get a number of node in the queue. For example, it can be used in numbered styles.
     *
     * @param {SenseNode} node
     * @returns {Number}
     */
    getNumberInQueue(node) {
        var number = this.queue.findIndex(n => n.id == node.id);
        return number >= 0 ? number : null;
    }
}
