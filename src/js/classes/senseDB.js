/**
 * This class was created to use IndexedDB technology in the system.
 * SenseDB offers simple methods to use that technology
 *
 * Created by Steve on 03.11.2016.
 */
class SenseDB {
    /**
     * Create an instance of the class
     *
     * @param {Object} options
     * @param {Function} [callback]
     */
    constructor(options, callback) {
        this.options = options || {};
        this.db = window.indexedDB || window.webkitIndexedDB;
        this.baseName = 'senseBase';
        this.storeName = 'senseFiles';
        this.initRest();
        if (typeof callback == 'function') {
            this.logError = callback;
        } else {
            /**
             * Show a error
             *
             * @param {*} event
             */
            this.logError = event => console.warn(event);
        }
        // console.log(this.options);
    }
    /**
     * Init the SenseDB system to use a new database
     */
    initRest() {
        this.currentSession = '';
        this.actionNumber = 0;
        this.versionLookup = {};
    }
    /**
     * Make connection to the IndexedDB system
     *
     * @param {Function} callback
     */
    connect(callback) {
        var senseDB = this,
            request = this.db.open(this.baseName, 1);
        request.onerror = this.logError;
        request.onsuccess = () => {
            if (typeof callback == 'function') {
                callback(request.result);
            }
        };
        request.onupgradeneeded = event => {
            var db = event.target.result;
            db.createObjectStore([senseDB.storeName], {keyPath: 'timestamp'});
            senseDB.connect(callback);
        };
    }
    /**
     * Get a saved session
     *
     * @param {String} sessionId
     * @param {Function} [callback]
     */
    loadSession(sessionId, callback) {
        if (this.options.indexedDB) {
            this.loadSessionFromIndexedDB(sessionId - 0, callback);
        } else {
            this.loadSessionFromAPI(sessionId, callback);
        }
    }
    /**
     * Get a saved session from the IndexedDB system
     *
     * @param {Number} sessionId
     * @param {Function} [callback]
     */
    loadSessionFromIndexedDB(sessionId, callback) {
        var senseDB = this;
        this.connect(db => {
            var transaction = db.transaction([senseDB.storeName], 'readonly'),
                objectStore = transaction.objectStore(senseDB.storeName),
                request = objectStore.get(sessionId - 0);
            request.onerror = senseDB.logError;
            request.onsuccess = () => {
                if (typeof callback == 'function') {
                    callback(request.result ? request.result : null, 'local');
                }
            };
        });
    }
    /**
     * Get a saved session from the API server
     *
     * @param {String} sessionId
     * @param {Function} [callback]
     */
    loadSessionFromAPI(sessionId, callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
                let response = JSON.parse(request.responseText);
                this.actionNumber = response.actions.length;
                this.currentSession = sessionId;
                this.versionLookup = {};
                response.nodes.forEach(node => {
                    this.versionLookup[node.id] = node._version;
                });
                if (typeof callback == 'function') {
                    callback(response, 'remote');
                }
            }
        };
        request.open('GET', this.options.api + '/' + this.options.email + '/' + sessionId);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send();
    }
    /**
     * Store the file and file description in indexedDB
     *
     * @param {Object} session
     * @param {Function} [callback]
     */
    saveSession(session, callback) {
        var senseDB = this;
        senseDB.connect(db => {
            var objectStore = db.transaction([senseDB.storeName], 'readwrite').objectStore(senseDB.storeName),
                request = objectStore.put(session);
            request.onerror = senseDB.logError;
            request.onsuccess = () => {
                if (typeof callback == 'function') {
                    callback(request.result);
                }
            };
        });
    }
    /**
     * Store prepared data to the Restful API server. If it happens at the first time we use the method POST,
     * save the current session for next saving by the method PUT
     *
     * @param {{actions: Array, nodes:Array, name: String|Undefined}} saveData
     * @param {Function} [callback]
     */
    storeSession2API(saveData, callback) {
        var request = new XMLHttpRequest(),
            method = this.actionNumber ? 'PUT' : 'POST',
            url = this.options.api + '/' + this.options.email;
        request.onreadystatechange = () => {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    // Increase the counter of last saved action
                    this.actionNumber += saveData.actions.length;
                    // If it's at the first time then save MongoDB session's id
                    if (method == 'POST') {
                        this.currentSession = request.responseText;
                    }
                    // Fill the version lookup table by the ids of the saved nodes
                    saveData.nodes.forEach(node => {
                        this.versionLookup[node.id] = node._version;
                    });
                    if (typeof callback == 'function') {
                        callback(request.responseText);
                    }
                }
            }
        };
        // If it's at the non-first time
        if (this.actionNumber && this.currentSession) {
            url += '/' + this.currentSession;
        }
        request.open(method, url);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(JSON.stringify(saveData));
    }
    /**
     * Remove the saved session
     *
     * @param {String} sessionId
     * @param {Function} callback
     */
    rmSession(sessionId, callback) {
        if (this.options.indexedDB) {
            this.rmSessionFromIndexedDB(sessionId - 0, callback);
        } else {
            this.rmSessionFromAPI(sessionId, callback);
        }
    }
    /**
     * Remove the saved session from the IndexedDB
     *
     * @param {Number} sessionId
     * @param {Function} callback
     */
    rmSessionFromIndexedDB(sessionId, callback) {
        var senseDB = this;
        this.connect(db => {
            var request = db.transaction([senseDB.storeName], 'readwrite')
                .objectStore(senseDB.storeName)
                .delete(sessionId - 0);
            request.onerror = senseDB.logError;
            request.onsuccess = function() {
                if (typeof callback == 'function') {
                    callback(request.result ? request.result : null);
                }
            };
        });
    }
    /**
     * Remove the saved session from the RestAPI server
     *
     * @param {String} sessionId
     * @param {Function} callback
     */
    rmSessionFromAPI(sessionId, callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
                if (typeof callback == 'function') {
                    callback();
                }
            }
        };
        request.open('DELETE', this.options.api + '/' + this.options.email + '/' + sessionId);
        request.send();
    }
    /**
     * Get all the saved sessions
     *
     * @param {Function} [callback]
     */
    listSessions(callback) {
        if (this.options.indexedDB) {
            this.listSessionsFromIndexedDB(callback);
        } else {
            this.listSessionsFromAPI(callback);
        }
    }
    /**
     * Get all the saved sessions from the IndexedDB system
     *
     * @param {Function} [callback]
     */
    listSessionsFromIndexedDB(callback) {
        var senseDB = this;
        this.connect(db => {
            var rows = [],
                store = db.transaction([senseDB.storeName], 'readonly').objectStore(senseDB.storeName);
            store.openCursor().onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    rows.push({id: cursor.key, timestamp: cursor.key, description: cursor.value.description});
                    cursor.continue();
                } else if (typeof callback == 'function') {
                    callback(rows);
                }
            };
        });
    }
    /**
     * Get all the saved sessions from the RestAPI server
     *
     * @param {Function} [callback]
     */
    listSessionsFromAPI(callback) {
        var rows = [],
            request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
                let responseStatus = JSON.parse(request.responseText);
                responseStatus.forEach(entry => {
                    rows.push({timestamp: Date.parse(entry.creationTime), description: entry.name, id: entry.id});
                });
                if (typeof callback == 'function') {
                    callback(rows);
                }
            }
        };
        request.open('GET', this.options.api + '/' + this.options.email);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send();
    }
    /**
     * Store the current session in SenseHistory to zip and save it in IndexedDB
     *
     * @param {SenseHistory} senseHistory
     * @param {Function} callback
     */
    saveWorkspace(senseHistory, callback) {
        if (this.options.indexedDB) {
            let zip = new SenseZip(senseHistory);
            zip.makeZip(zipData => {
                this.saveSession(zipData, callback);
            });
        } else {
            // filtered data
            let exportedNodes = senseHistory.export, saveData = {
                actions: senseHistory.actions.map(SenseNode.getCoreData).filter((elx, idx) => idx > this.actionNumber),
                nodes: exportedNodes.filter(
                    el => !(this.versionLookup[el.id] && el._version > this.versionLookup[el.id])
                )
            };
            // Set the field name at the first time
            if (!this.actionNumber) {
                saveData.name = senseHistory.description;
            }
            this.storeSession2API(saveData, callback);
        }
    }
}
