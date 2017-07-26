/**
 * The class SenseTask is an abstraction to use in the class SenseHistory and store all the pending task
 * corresponding to the URL. When the application catches the event backgroundOpened it can launch
 * a task which is registered before
 *
 * Created by Steve on 26.11.2016.
 */
class SenseTask {
    constructor() {
        this.collection = {};
    }
    /**
     * Check expired tasks, check if the task is already exist and add it if none
     *
     * @param {String} url
     * @param {Function} action
     */
    add(url, action) {
        // cleanup all the tasks before adding a one
        this.cleanup();
        // check and add task
        if (!this.collection[url]) {
            this.collection[url] = {
                action: action,
                timestamp: Date.now()
            };
        }
    }
    /**
     * Call the task for the url which is stored early
     *
     * @param {String} url
     */
    run(url) {
        var task = this.collection[url];
        if (task) {
            if (typeof task.action == 'function') {
                task.action.call(null);
            }
            this.rm(url);
        }
    }
    /**
     * Remove the task corresponding to the url
     *
     * @param {String} url
     */
    rm(url) {
        delete this.collection[url];
    }
    /**
     * Cleanup all the tasks using the constant EXPIRED_TIME
     */
    cleanup() {
        const EXPIRED_TIME = 300000;
        for (var url in this.collection) {
            let task = this.collection[url];
            if (Date.now() - task.timestamp > EXPIRED_TIME) {
                this.rm(url);
            }
        }
    }
}
