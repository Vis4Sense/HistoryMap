/**
 * The class SenseHistory is an object which contains an array of SenseContainers and/or SenseNodes
 * It’s data presentation of ‘History Map’
 * Created by steve on 8/24/16.
 */
class SenseHistory extends SenseQueue {
    /**
     * Create a data presentation instance for History Map
     *
     * @param {{debugHistory: Boolean, noMediator: Boolean, firefoxSnapshot: Boolean,
     *  noSnapshots: Boolean, title: String, inventory: Boolean}} [options]
     */
    constructor(options) {
        // Todo need to decide what extension by default we use in the future
        const title = 'History Map';
        super();
        if (Object.keys(options).length) {
            if (!options.title) {
                options.title = title;
            }
            options.noSnapshots = !!options.noSnapshots;
            options.firefoxSnapshot = !!options.firefoxSnapshot;
            options.debug = !!options.debugHistory;
            options.markLastNodes == !!options.markLastNodes;
        } else {
            options = {
                title: title,
                noSnapshots: false,
                firefoxSnapshot: true,
                markLastNodes: true,
                debug: false
            };
        }
        this.generateNewId();
        this.options = options;
        this.console = new SenseConsole({debug: options.debug});
        // Collection where information about all the visited tabs is stored
        this.tabs = new SenseTab(options);
        this.tasks = new SenseTask();
        this.initData();
        // This property saves the following fields: an url, a tab id and a window id of the last action
        this._previousState = {url: undefined, tabId: undefined, windowId: undefined};
        // this.lastUrlClicked = undefined;
        // It's a small transaction system
        this.transactionSystem = new SenseTransaction();
        // It were the variable lastUrl, lastTime, lastType in the browser.js
        this.lastMessage = {
            url: undefined,
            time: undefined,
            type: undefined
        };
        // this.senseContainers = [];
        this.idNodeGenerator = senseNodeIterator();
        this.dispatch = d3.dispatch('dataChanged');
        if (!options.noMediator) {
            // Mode to capture user activity
            this.listening = true;
            this.setMediator();
        } else {
            this.listening = false;
        }
    }
    /**
     * Set mediator for the History Map. Mediator promotes loose coupling by keeping objects from referring to
     * each other explicitly, and it lets you vary their interaction independently.
     */
    setMediator() {
        var history = this;
        history.tabCreated = function(tab) {
            if (registerEvent('tabCreated')) {
                history.onceAutoInventory();
                // below was history.updateLastUrlClicked(tab.id);
                history.onTabCreated(tab);
            }
        };
        this.tabUpdated = function(tabId, changeInfo, tab) {
            if (registerEvent('tabUpdated')) {
                history.onceAutoInventory();
                history.onTabUpdated(tabId, changeInfo, tab);
            }
        };
        this.tabActivated = function(activeInfo) {
            if (registerEvent('tabActivated')) {
                history.onceAutoInventory();
                history.onTabActivated(activeInfo);
            }
        };
        history.onTabClosed = function(tabId, removeInfo) {
            if (registerEvent('tabClosed')) {
                history.onceAutoInventory();
                history.tabClosed(tabId, removeInfo);
            }
        };
        this.messageReceived = function(request, sender) {
            if (request.type == 'mousemove') {
                return;
            }
            if (registerEvent('messageReceived[' + request.type + '] ')) {
                history.onceAutoInventory();
                history.onMessageReceived(request, sender);
            }
        };
        this.contextMenus = function(info, tab) {
            if (registerEvent('clickedContextMenus')) {
                history.onceAutoInventory();
                history.tabs.involveIgnored(tab);
                switch (info.menuItemId) {
                    case 'sm-highlight':
                        history.clickContextHighlight(tab);
                        break;
                    case 'sm-save-image':
                        history.clickNewSnapshot(info, tab);
                        break;
                    default:
                        history.console.warn('SenseHistory.contextMenus: unknown the menu item ' + info.menuItemId);
                        break;
                }
            }
        };
        chrome.tabs.onCreated.addListener(history.tabCreated);
        chrome.tabs.onUpdated.addListener(history.tabUpdated);
        chrome.tabs.onActivated.addListener(history.tabActivated);
        chrome.tabs.onRemoved.addListener(history.onTabClosed);
        chrome.runtime.onMessage.addListener(history.messageReceived);
        chrome.contextMenus.onClicked.addListener(history.contextMenus);
        // Binds custom events
        d3.rebind(this, this.dispatch, 'on');
        /**
         * Check an event in and return boolean value if the mediator is on his duty
         *
         * @param {String} event
         * @param {Object} [tab]
         * @returns {Boolean}
         */
        function registerEvent(event, tab) {
            if (!history.listening) {
                history.console.info('--- ' + event + ' ---');
            } else if (tab) {
                history.console.info(event + ': ', JSON.stringify(tab));
            }
            return history.listening;
        }
    }
    /**
     * Handle an event of the new tab creation
     *
     * @param {Object} tab
     */
    onTabCreated(tab) {
        var history = this, infoString = 'onTabCreated[';
        history.tabs.addTab(tab);
        if (tab.status == 'loading') {
            infoString += [tab.openerTabId + '=>' + tab.id, tab.windowId].join(':') + ']: ';
            if (this.previousState.tabId == tab.openerTabId && this.previousState.windowId == tab.windowId) {
                let trId, node = this.previousState.node;
                if (!node || SenseURL.isUrlIgnored(tab.url)) {
                    return;
                }
                // Here we should start a transaction using SenseHistory.previousState
                trId = this.transactionSystem.start(this.previousState, tab, node);
                history.console.log(infoString + 'started transaction ' + trId + ': ' + tab.url, node.url);
            } else if (tab.openerTabId) {
                // If something came wrong then try to get source node and start transaction
                chrome.tabs.get(tab.openerTabId, sourceTab => {
                    let trId, node = history.lookupNode(sourceTab.url);
                    // skip creating transaction if any node is not found
                    if (!node || SenseURL.isUrlIgnored(tab.url)) {
                        return;
                    }
                    trId = this.transactionSystem.start(sourceTab, tab, node);
                    history.console.log(infoString + 'started transaction ' + trId);
                });
            }
        } else if (tab.url) {
            // If there was created a duplicate tab in the browser
            let node = this.createRevisitAction(tab);
            // calculate
            history.tabs.invCount(tab.url, count => {
                if (this.options.debug) {
                    infoString += [tab.id, tab.windowId, tab.url].join(':') + ']: ' + count + ' ';
                    history.console.info(infoString, tab, node);
                }
            });
        } else if (this.previousState.wasClick) {
            // Try to start transaction
            let trId, node = this.previousState.node;
            // skip creating transaction if any node is not found
            if (!node) {
                return;
            }
            trId = this.transactionSystem.start(this.previousState, tab, node);
            if (this.options.debug) {
                infoString += [tab.id, tab.windowId, tab.url].join(':') + ']: started a clicked transaction ';
                history.console.info(infoString + trId, this.transactionSystem.transactions);
            }
        } else {
            if (this.options.debug) {
                infoString += [tab.id, tab.windowId, tab.url].join(':') + ']: ';
                history.console.info(infoString, this.previousState.wasClick);
            }
        }
    }
    /**
     * Handle an event of the tab activation. If no node is found then call SenseHistory.createRevisitAction()
     *
     * @param {{tabId: Number, windowId: Number}} activeInfo
     * @param {Function} [callback]
     */
    onTabActivated(activeInfo, callback) {
        var history = this,
            detectNode = this.senseNodes.find(
                node => node.tabId == activeInfo.tabId && node.windowId == activeInfo.windowId
            ),
            logInfo = 'onTabActivated[' + [activeInfo.tabId, activeInfo.windowId].join(':') + ']: ';
        history.console.info(logInfo, detectNode, this.previousState);
        // The system updates the field endTime when a user switches to a new tab
        this.setEndTimeToPrevUrl();
        // Turn highlight off to all, only highlight the active one later
        this.turnHighlightsOff(true);
        chrome.tabs.query({windowId: activeInfo.windowId, active: true}, tabs => {
            var node, transactionId, tab = tabs[0];
            // check if a tab must be skipped
            if (history.mustBeSkipped(tab)) {
                history.updateTransactionOrPreviousState(tab);
                return;
            }
            transactionId = history.transactionSystem.lookup(tab, false);
            // Check nodes
            if (detectNode && detectNode.url == tab.url) {
                node = detectNode;
                this.tabs.addTab(tab);
            } else if (transactionId >= 0) {
                history.console.log(logInfo + 'finished the transaction ' + transactionId);
                node = history.finishTransaction(tab, transactionId);
            } else {
                /**
                 * The block below is a candidate to remove from the code because the customer wants to fix the following:
                 * TODO B9 - do not create a new node in collection view when switching to tabs opened before starting
                 * TODO a SenseMap session. However, add the node if more work is done on the page, such as clicking a link
                 */
                // Look a node with the same url but not the same tabId and windowsId
                node = history.lookupNode(tab.url);
                if (!node) {
                    // Either add a 'revisit' action or a normal action
                    // (happen when switch to a tab which was opened before the extension)
                    node = this.createRevisitAction(tab);
                    history.console.log(logInfo, node);
                    // check if node is a search engine and the filter is presented
                    /*
                    if (node.isSearchEngine && !node.hasSearchFilter(queryTab.url)) {
                        let operation = SenseURL.detectSearchEngine(queryTab.url),
                            filter = this.createFilter(queryTab, 'filter', operation.label);
                        // console.log(filter);
                    }
                    */
                }
            }
            let forceUpdate = node.isSearchEngine || !node.seen;
            history.updateNode(node, tab, {forceUpdateSnapshot: forceUpdate});
            // Manually set node.seen true because updateNode() is an universal function
            node.seen = true;
            history.previousState = {
                url: tab.url, tabId: tab.id, windowId: tab.windowId, node: node
            };
            if (typeof callback == 'function') {
                callback();
            }
        });
    }
    /**
     * Handle an event of update in the tab. The logic below is:
     * a) if a node is exist then activate it
     * b) if a transaction is present then finish the transaction
     * c) if the event occurs in the same tab then start or continue the branch on the History Map
     * d) otherwise: do standard analyse which is used in the old version of the system
     *
     * The note below was for old variant of the function onTabUpdated() of the module provenance.browser.js:
     * Couldn't distinguish between auto reload and normal first load. I don't want to include auto reload page.
     * So, don't capture revisit here at all. If the user opens a revisited page,
     * accept a known bug that it's not captured.
     *
     * @param {Number} tabId
     * @param {Object} changeInfo
     * @param {Object} tab
     */
    onTabUpdated(tabId, changeInfo, tab) {
        // Reset ignoreTabActivated when tab updating because the application has been started.
        // It should be before checking on 'it must be skipped or not?'
        this.tabs.involveIgnored(tab);
        // Check if this tab must be skipped
        if (this.mustBeSkipped(tab)) {
            this.updateTransactionOrPreviousState(tab);
            return;
        }
        // Launch the below methods if changeInfo status is only 'complete'
        this[tab.active ? 'onActiveTabUpdate' : 'onInactiveTabUpdate'](tabId, tab);
    }
    /**
     * A handler to call when a tab is closed
     * https://developer.chrome.com/extensions/tabs#event-onRemoved
     *
     * @param {Number} tabId
     * @param {Object} removeInfo
     */
    tabClosed(tabId, removeInfo) {
        var logInfo = 'tabClosed[' + tabId + ']: ',
            history = this,
            info = {tabId: tabId, windowId: removeInfo.windowId},
            tabsInfo;
        // Cleanup all the transactions which are linked to the tab
        if (this.transactionSystem.cleanup(info)) {
            history.console.warn('Some transactions were removed');
        }
        // Check and involve active ignored tab
        history.tabs.involveIgnored(info);
        tabsInfo = this.tabs.lookupTabWindow(info);
        if (tabsInfo.url) {
            let foundNode = this.senseNodes.find(node => node.url == tabsInfo.url);
            if (foundNode instanceof SenseNode) {
                foundNode.highlighted = false;
                foundNode.endTime = Date.now();
                // remove tab and update node with info from this.tabs
                this.tabs.rmTab(info, foundNode);
                // Set highlight to found node if it's in the active window
                chrome.tabs.query({windowId: removeInfo.windowId, active: true}, tabs => {
                    var activeTab = tabs[0];
                    if (foundNode.url == activeTab.url) {
                        foundNode.tabId = activeTab.id;
                        foundNode.windowId = activeTab.windowId;
                        foundNode.highlighted = true;
                        history.tabs.addTab(activeTab);
                        history.dispatch.dataChanged('update', false, foundNode);
                    }
                });
                this.dispatch.dataChanged('update', false, foundNode);
            }
        }
        history.console.log(logInfo, removeInfo, tabsInfo);
    }
    /**
     * Handle an event when there is coming any message in the system
     *
     * @param {Object} request
     * @param {Object} sender
     * @return {boolean}
     */
    onMessageReceived(request, sender) {
        var history = this, actions = history.actions, node;
        // Skip this event if it's in the ny ignore event
        if (SenseHistory.isIgnoredEvent(request.type)) {
            return false;
        }
        // Reset ignoreTabActivated when tab updating
        history.tabs.involveIgnored(sender.tab);
        switch (request.type) {
            case 'noted':
                node = actions.find(a => a.url === sender.tab.url && a.classId === request.data.classId);
                if (node) {
                    node.text = request.data.text;
                    node.type = 'note';
                    history.dispatch.dataChanged(request.type);
                }
                break;
            case 'highlightRemoved':
                // Lookup a node and a highlight with sender.tab.url and request.classId
                history.removeHighlight(sender.tab, request.classId);
                break;
            case 'linkClicked':
                history.clickOnLink(sender.tab);
                break;
            // case 'backgroundOpened':
            //     console.log('onMessageReceived[backgroundOpened]: ', sender.tab, request, JSON.stringify(sender));
            //     break;
            default:
                if (SenseHistory.isRegisteredType(request.type)) {
                    history.console.log('onMessageReceived type: ', request.type);
                    let a = {
                        time: request.time,
                        type: request.type
                    }, isTheSameEvent = history.lastMessage.type === a.type
                        && a.time - history.lastMessage.time < 1000;

                    // No need url for two views
                    if (!request.type.startsWith('col-') && !request.type.startsWith('cur-')) {
                        if (history.lastMessage.url !== sender.tab.url) {
                            history.lastMessage.url = a.url = sender.tab.url; // To save space
                        }
                    }

                    // Same event, within 1s, don't capture
                    if (!isTheSameEvent) {
                        /**
                         * TODO investigate behavior of the senseHistory.browsingActions
                         * senseHistory.browsingActions becomes bigger when this extension is launched.
                         * It's potential risk with the normal operation of the system
                         * console.log('onMessageReceived: ', senseHistory.browsingActions);
                         */
                        history.browsingActions.push(a);
                        history.lastMessage.time = a.time;
                        history.lastMessage.type = a.type;
                    }
                }
                break;
        }
    }
    /**
     * This method was created to achieve a goal of separating two things: actions and nodes.
     * The code below was grabbed from the function createNewAction() from the module sm.provenance.browser
     *
     * @param {Object} tab
     * @returns {SenseNode}
     */
    createRevisitAction(tab) {
        var action = this.lookupNode(tab.url),
            logInfo = 'createRevisitAction[' + [tab.id, tab.windowId].join(':') + ']: ',
            state = {url: action ? action.url : undefined, tabId: tab.id, windowId: tab.windowId, node: undefined};
        this.console.info(logInfo + tab.url);
        // Turn all the highlighted nodes off
        this.turnHighlightsOff();
        // Check if there is an existed node in the History Map
        if (action) {
            action.highlighted = true;
            this.updateNode(action, tab);
            state.url = action.url;
        } else {
            action = this.addNode(tab, {highlighted: tab.active, seen: tab.active});
        }
        // Save current state as previous
        state.node = action;
        this.previousState = state;
        // Todo It's a question why the 'revisit' type is here and what type should we use
        this.dispatch.dataChanged('revisit', true, action);
        return action;
    }
    /**
     * Set the field endTime of previous node to the current moment
     */
    setEndTimeToPrevUrl() {
        if (this.hasPreviousState) {
            let filteredActions = this.actions.filter(a => !SenseNode.isEmbeddedType(a.type)),
                action = _.findLast(filteredActions, a => a.url === this.prevUrl);
            if (action) {
                action.endTime = Date.now();
            }
        }
    }
    /**
     * Switch listening mode and get a new string for the button Pause
     *
     * @returns {string}
     */
    switchAndGetPauseButton() {
        this.listening = !this.listening;
        return this.listening
            ? '<i class="fa fa-pause"></i> Pause'
            : '<i class="fa fa-play"></i> Resume';
    }
    /**
     * if the key inventory in the options is set update all the opened nodes and turn it off
     */
    onceAutoInventory() {
        var history = this;
        if (this.options.inventory) {
            chrome.tabs.query({}, tabs => {
                tabs.forEach(t => {
                    history.addNode({
                        url: t.url, tabId: t.id, windowId: t.windowId, title: t.title, favIconUrl: t.favIconUrl
                    }, {
                        highlighted: t.active, snapshot: t.active
                    });
                });
            });
            this.tabs.invTabs();
            this.options.inventory = false;
            this.actions.push({type: 'start-from-scratch', time: new Date()});
        } else if (!this.alreadyRegisteredTabs) {
            // Save in history.tabs.activeIgnored all the already opened tabs
            chrome.tabs.query({}, tabs => {
                tabs.forEach(tab => {
                    history.tabs.activeIgnored.push({tabId: tab.id, windowId: tab.windowId});
                });
            });
            this.alreadyRegisteredTabs = true;
        }
    }
    /**
     * Look all the nodes up by tab information
     *
     * @param {{tabId: Number, windowId: Number}} [searchInfo]
     * @returns {Array}
     */
    lookupNodesByTab(searchInfo) {
        var nodes = [], tabId = searchInfo.tabId ? searchInfo.tabId : searchInfo.id;
        if (searchInfo && tabId && searchInfo.windowId)  {
            nodes = this.senseNodes.filter(node =>
                node.tabId == tabId && node.windowId == searchInfo.windowId
            );
        }
        return nodes;
    }
    /**
     * Analyze and lookup node. Return Null if there is not any node with the params
     *
     * @param {String} url
     * @param {{tabId: Number, windowId: Number}} [searchInfo]
     * @returns {SenseNode|undefined}
     */
    lookupNode(url, searchInfo) {
        var node;
        // find node using searchInfo if it's presented
        if (searchInfo) {
            node = this.senseNodes.find(n =>
                n.tabId === searchInfo.tabId && n.windowId === searchInfo.windowId
            );
            // check and return it if url is equal foundNode.url
            if (!(node && node.url == url)) {
                node = undefined;
            }
        } else {
            // Try to find by url
            node = this.senseNodes.find(n => n.url == url);
            if (!node) {
                // Try to find someone's children in the array 'this.actions'
                let children = this.actions.find(n => n.url == url);
                if (children && children.keeper) {
                    node = children.keeper;
                }
            }
        }
        return node;
    }
    /**
     * Check and create a node, add this node to this object and return that node.
     * If an url is a search engine, then create a node with normalized url
     *
     * @param {{url: String, id: Number, windowId: Number,
     *      title: String, favIconUrl: String, type: String,
     *      tabId: Number|undefined}} addInfo
     * @param {{highlighted: Boolean|undefined, seen: Boolean|undefined}} [options]
     * @returns {SenseNode}
     */
    addNode(addInfo, options) {
        var history = this,
            type = addInfo.type ? addInfo.type : 'type',
            node, url = addInfo.url, searchEngine;

        if (SenseURL.isUrlIgnored(addInfo.url)) {
            return null;
        }

        // node = this.lookupNode(url, {tabId: tabId, windowId: addInfo.windowId});
        node = this.lookupNode(url);
        if (node) {
            // unlink the nodes which are linked to this tab.
            history.cleanSetTabIdWindowId(addInfo, node);
            return node;
        }
        searchEngine = SenseURL.detectSearchEngine(url);
        if (searchEngine) {
            if (searchEngine.type == 'search') {
                // url = SenseURL.uniURL(url, searchEngine.label);
                addInfo.title = searchEngine.label + ' - ' + searchEngine.name;
            }
            type = searchEngine.type;
        }
        // Check if type is equal to the browser's type 'typed'
        if (type == 'typed') {
            type = 'type';
        }
        node = new SenseNode(url, addInfo.title, type, addInfo.favIconUrl, this.idNodeGenerator);
        // unlink the nodes which are linked to this tab.
        history.cleanSetTabIdWindowId(addInfo, node);
        node.isSearchEngine = type == 'search';
        // Set options if they are preset
        if (options) {
            if (typeof options.highlighted == 'boolean') {
                node.highlighted = options.highlighted;
            }
            if (typeof options.seen == 'boolean') {
                node.seen = options.seen;
            }
            node.takeSnapShot(addInfo.windowId, {noSnapshots: !node.seen}, isUpdated => {
                if (isUpdated) {
                    history.dispatch.dataChanged('image', true, node);
                }
            });
        }
        this.tabs.addTab(addInfo);
        this.senseNodes.push(node);
        this.actions.push(node);
        // Launch update favIcon if it's undefined
        if (typeof node.favIconUrl == 'undefined') {
            setTimeout(function() {
                history.console.log('SenseHistory.addnode: favIconUrl updated after 1s', node);
                node.updateFavIconUrl();
                history.dispatch.dataChanged('update', true, node);
            }, 1000);
        }

        return node;
    }
    /**
     * Update node by information from the current tab, options and dispatcher
     *
     * @param {SenseNode} node
     * @param {Object} tab
     * @param {Object} [options]
     */
    updateNode(node, tab, options) {
        var history = this, callDispatch = false,
            options = options || {skipUrl: false};
        // Update url if it doesn't have actual information
        if (tab.url !== node.url && !options.skipUrl) {
            let searchEngine = SenseURL.detectSearchEngine(tab.url);
            node.url = tab.url;
            node.isSearchEngine = searchEngine && searchEngine.type == 'search';
            callDispatch = true;
        }
        // The only practical update I've seen!
        if (tab.favIconUrl) {
            node.updateFavIconUrl();
            callDispatch = true;
        }
        // Check a new title of the tab
        if (options.title) {
            node.title = options.title;
            callDispatch = true;
        } else if (tab.title && (tab.title !== node.title || tab.title !== node.text)) {
            node.title = tab.title;
            callDispatch = true;
        }
        // unlink the nodes which are linked to this tab.
        history.cleanSetTabIdWindowId(tab, node);
        // Update the collection this.tabs
        node.seen = tab.active;
        node.highlighted = tab.active;
        // Check if tab is active
        if (tab.active) {
            // Capture a snapshot if not yet
            if (!node.image || !options.noSnapshots || options.forceUpdateSnapshot) {
                node.takeSnapShot(tab.windowId, options, isUpdated => {
                    if (isUpdated) {
                        // Todo need to figure out why the 'image' type is preferred then 'snapshot'
                        history.dispatch.dataChanged('image', true, node);
                    }
                });
            }
            // The block below was in onTabUpdated() of sm.provenance.browser
            if (node.collectionRemoved) {
                let removeCollectionActionId = history.actions.findIndex(
                    action => action.type == 'remove-collection-node' && action.id == node.id
                );
                if (removeCollectionActionId >= 0) {
                    history.actions.splice(removeCollectionActionId, 1);
                }
                delete node.collectionRemoved;
            }
            callDispatch = true;
        }

        // Check if the dispatch is needed to call
        if (callDispatch) {
            this.dispatch.dataChanged('update', true, node);
        }
    }
    /**
     * Mark the node as collectionRemoved and set a new leader to all the slaves and return them
     *
     * @param {SenseNode} node
     * @returns {Array}
     */
    removeNode(node) {
        var newLeader = node.leader,
            slaves = [], nodeSlavesLength = node.slaves.length;
        // Move all the children to parent of this node
        for (var i = 0; i < nodeSlavesLength; i++) {
            // The line below is very strange but it's correct because node.slaves is self-modifying array
            node.slaves[0].leader = newLeader;
        }
        // Todo need to find out what kind of behavior should be the node: cut a link with the leader or not
        // node.leader = undefined;
        if (newLeader) {
            newLeader.slaves.forEach(slave => { slaves.push(slave); });
        }
        // Mark node as a collectionRemoved node
        node.collectionRemoved = true;
        return slaves;
    }
    /**
     * Create a new highlight in the system. If a node isn't exist then create it.
     *
     * @param {Object} tab
     * @param {{text: String, path: String, classId: String, type: String}} params
     */
    createHighlight(tab, params) {
        var highlight, node = this.lookupNode(tab.url);

        if (!node) {
            node = this.addNode(tab, {highlighted: true, seen: true});
        }
        highlight = new SenseHighlight(node, params, this.idNodeGenerator);
        // The 6 lines below are candidates for removing
        highlight.parent = node;
        if (node.children && node.children.length) {
            node.children.push(highlight);
        } else {
            node.children = [highlight];
        }
        // console.log(highlight);
        highlight.from = node.isEmbedded() ? node.from : node.id;
        if (this.tabIdToParentIdLookup[tab.id]) {
            highlight.from = this.tabIdToParentIdLookup[tab.id].id;
        }
        // Todo plan a double check why lines below are needed to us
        this.actions.forEach(a => { a.highlighted = node.url === a.url; });
        this.actions.push(highlight);
        this.senseNodes.push(node);
        this.dispatch.dataChanged(params.type, true);
        return node;
    }
    /**
     * Create a highlight by context menu
     *
     * @param {Object} tab
     */
    clickContextHighlight(tab) {
        var history = this;
        chrome.tabs.sendMessage(tab.id, {type: 'highlightSelection'}, d => {
            if (d) {
                d.type = 'highlight';
                let node = history.createHighlight(tab, d);
                history.previousState = {url: tab.url, tabId: tab.id, windowId: tab.windowId, node: node};
            }
        });
    }
    /**
     * Remove the highlight node with classId and unlink with the parent node.
     *
     * @param {Object} tab
     * @param {String} classId
     * @returns {SenseNode} parent node
     */
    removeHighlight(tab, classId) {
        var idx = this.actions.findIndex(n => n.url == tab.url && n.classId && n.classId == classId),
            highlight, node;
        if (idx >= 0) {
            highlight = this.actions[idx];
            node = highlight.keeper;
            // This field is synthetic
            delete highlight.parent;
            // This field is object natural
            highlight.keeper = undefined;
            highlight.removed = true;
            // Remove it from actions
            this.actions.splice(idx, 1);
            // Clean node's children
            idx = node.children.findIndex(h => h.classId == classId);
            if (idx >= 0) {
                node.children.splice(idx, 1);
            }
            this.console.log('onMessageReceived.highlightRemoved: a found node is ', node);
            this.dispatch.dataChanged('highlightRemoved', true);
        }
        return node;
    }
    /**
     * Create a new snapshot of the node based on another image
     *
     * @param info
     * @param tab
     */
    clickNewSnapshot(info, tab) {
        // Lookup and create a node if it needs
        var node = this.createRevisitAction(tab);
        if (!this.options.noSnapshots) {
            // Overwrite existing image
            node.userImage = info.srcUrl;
            this.dispatch.dataChanged('image', true, node);
            this.previousState = {url: tab.url, tabId: tab.id, windowId: tab.windowId, node: node};
        }
    }
    /**
     * Handle to a click event on a link
     *
     * @param {Object} tab
     */
    clickOnLink(tab) {
        var history = this,
            logInfo = 'clickOnLink[' + [tab.id, tab.windowId, tab.url].join(':') + ']: ',
            transactionId = this.transactionSystem.lookup(tab, false);
        if (transactionId >= 0) {
            let srcNode = this.transactionSystem.getSrcNode(transactionId);
            this.transactionSystem.finish(srcNode, nodeHighlightAndSeen);
        } else {
            let node = this.lookupNode(tab.url);
            if (!node) {
                node = this.addNode(tab, {highlighted: true, seen: true});
            }
            nodeHighlightAndSeen(node);
        }
        /**
         * Set the node as highlighted and seen
         *
         * @param {SenseNode} node
         */
        function nodeHighlightAndSeen(node) {
            if (node) {
                node.highlighted = true;
                node.seen = true;
                history.dispatch.dataChanged('update');
            }
            // Keep in mind that the line below is needed to start transaction if a new tab is opened
            history.previousState = {url: tab.url, tabId: tab.id, windowId: tab.windowId, node: node, wasClick: true};
            history.console.log(logInfo, history.previousState);
        }
    }
    /**
     * Get an array of the SenseNodes in export format
     *
     * @return {Array}
     */
    get export() {
        return this.senseNodes.map(node => node.export);
    }
    /**
     * Restored all the nodes, relations and links for the field this.senseNodes
     *
     * @param {Array} data
     */
    set export(data) {
        var newNodes = [];
        data.forEach(n => {
            var newNode;
            if (SenseHighlight.isOwnType(n.type)) {
                newNode = new SenseHighlight();
            } else {
                newNode = new SenseNode();
            }
            newNode.export = n;
            newNodes.push(newNode);
        });
        SenseNode.fixImport(newNodes);
        this.senseNodes = this.senseNodes.concat(newNodes);
    }
    /**
     * Start new data
     */
    initData() {
        // all the nodes has been grouped in array to compatibility with the old system
        // All actions added in temporal order including 'revisit' and 'child' actions
        this.actions = [];
        this.browsingActions = [];
        this.senseNodes = [];
        // Todo need to check why we need this variable
        this.tabIdToParentIdLookup = {};
    }
    /**
     * Clear the whole history and start a new one
     *
     * @param {Function} [callback]
     * @returns {Promise}
     */
    clearHistory(callback) {
        var self = this,
            promise = new Promise(resolve => {
                self.initData();
                self.tabs.clean();
                if (typeof callback == 'function') {
                    self.cleanAndBuildLookups(() => {
                        callback();
                        resolve(true);
                    });
                } else {
                    self.cleanAndBuildLookups(() => {
                        resolve(true);
                    });
                }

            });

        return promise;
    }
    /**
     * Rebuild this.tabs and all the nodes
     *
     * @param {Function} callback
     */
    cleanAndBuildLookups(callback) {
        var history = this;
        // Build lookup using loaded actions (it was in the function sm.provenance.browser.buildLookups())
        this.tabs.clean();
        // Build lookup using opening tabs
        chrome.tabs.query({}, tabs => {
            tabs.forEach(t => {
                var n = history.lookupNode(t.url);
                if (n) {
                    n.highlighted = t.active;
                }
            });
            callback();
        });
    }
    /**
     * Check and create a new filter as children in the node
     *
     * @param {Object} tab
     * @param {SenseNode} previousNode
     */
    createFilterNode(tab, previousNode) {
        var infoString = 'createFilterNode[' + [tab.id, tab.windowId].join(':') + ']: ', node, filter;

        if (previousNode) {
            node = previousNode;
            filter = node.nested.find(child => child.url == tab.url);
            // Check if the filter is already created for this tab.url
            if (!filter) {
                filter = new SenseHighlight(node, {
                    url: tab.url, text: tab.title, type: 'filter', classId: undefined, path: undefined
                }, this.idNodeGenerator);
                // Create relationship parent-child
                filter.keeper = node;
                filter.parent = node;
                if (node.children && node.children.length) {
                    node.children.push(filter);
                } else {
                    node.children = [filter];
                }
                // Add to the array 'this.actions' to lookup
                this.actions.push(filter);
            }
            node.highlighted = true;
            node.seen = true;
        } else {
            node = this.addNode(tab, {highlighted: true, seen: true});
        }
        this.dispatch.dataChanged('update', true);
        this.console.log(infoString, node);
        return node;
    }
    /**
     * Get visit type and call callback with a one of the following values {'bookmark', 'type', 'link'}
     * Documentation is here https://developer.chrome.com/extensions/history#transition_types
     *
     * @param {Object} tab
     * @param {SenseNode|Null} leader
     * @param {Function} [callback]
     */
    getTypeAndCreateNode(tab, leader, callback) {
        var history = this, url = tab.url;
        chrome.history.getVisits({url: url}, results => {
            const bookmarkTypes = ['auto_bookmark'],
                typedTypes = ['typed', 'generated', 'keyword', 'keyword_generated'];
            var node;
            if (results && results.length) {
                // The latest one contains information about the just completely loaded page
                let visitTransition = results[results.length - 1].transition,
                    type = bookmarkTypes.includes(visitTransition)
                        ? 'bookmark'
                        : typedTypes.includes(visitTransition) ? 'typed' : 'link';
                history.console.log('getTypeAndCreateNode[' + url + ']: ' + visitTransition + ' => ' + type);
                tab.type = type;
            } else {
                tab.type = typedTypes[1];
            }
            node = history.addNode(tab, {highlighted: tab.active, seen: tab.active});
            // Set leader for a new node
            if (leader && !(['bookmark', 'typed'].includes(tab.type))) {
                node.leader = leader;
            }
            if (typeof callback == 'function') {
                callback(node);
            }
        });
    }
    /**
     * Call SenseHistory.getTypeAndCreateNode() and set the current state
     *
     * @param {Object} tab
     * @param {SenseNode|Null} leader
     * @param {Function} [callback]
     */
    createdNodeUpdateStatus(tab, leader, callback) {
        var history = this;
        this.getTypeAndCreateNode(tab, leader, node => {
            if (typeof callback == 'function') {
                callback(node);
            }
            history.previousState = {
                url: tab.url, tabId: tab.id, windowId: tab.windowId, node: node
            };
        });
    }
    /**
     * Investigate tab to skip or not to skip it
     *
     * @param {Object} tab
     * @returns {Boolean}
     */
    mustBeSkipped(tab) {
        return !this.listening
            // Check if this tab is not involved
            || this.tabs.isActiveIgnored(tab)
            || SenseTab.isIgnored(tab);
    }
    /**
     * If the tab must be skipped the update transaction (if it's exist) or previous state
     * @param {Object} tab
     */
    updateTransactionOrPreviousState(tab) {
        if (tab.active && tab.status == 'complete') {
            this.previousState = {
                url: tab.url, tabId: tab.id, windowId: tab.windowId, node: undefined
            };
        }
    }
    /**
     * Finish the transaction with transactionId
     *
     * @param {Object} tab
     * @param {Number} transactionId
     * @returns {SenseNode}
     */
    finishTransaction(tab, transactionId) {
        // If there is a transaction in the tab then finish it
        var history = this,
            transaction = this.transactionSystem.transactions[transactionId], node,
            tabId = tab.tabId ? tab.tabId : tab.id,
            infoString = 'finishTransaction[' + [tabId, tab.windowId, transactionId].join(':') + ']: ';
        tab.type = 'link';
        node = this.addNode(tab, {highlighted: tab.active, seen: tab.active});
        infoString += 'detected transaction ' + transaction.id;
        history.transactionSystem.finish(node, srcNode => {
            node.leader = srcNode;
            history.dispatch.dataChanged(tab.type);
            history.console.info(infoString,
                [srcNode.id, srcNode.tabId, srcNode.windowId], '=>', [node.id, node.tabId, node.windowId]
            );
        });
        return node;
    }
    /**
     * Check if the var type is registered in the History Map
     *
     * @param {String} type
     * @returns {Boolean}
     */
    static isRegisteredType(type) {
        return [
            'focus', 'blur', 'keydown', 'mousewheel', 'mousemove', 'mousedown',
            'col-focus', 'col-blur', 'col-keydown', 'col-mousewheel', 'col-mousemove', 'col-mousedown'
        ].includes(type);
    }
    /**
     * Check if the type belongs to the ignored events
     *
     * @param {String} type
     * @returns {Boolean}
     */
    static isIgnoredEvent(type) {
        const ignoreEvents = [
            'focus', 'blur', 'keydown', 'mousewheel', 'mousemove', 'mousedown',
            'cur-focus', 'cur-blur', 'cur-keydown', 'cur-mousewheel', 'cur-mousemove', 'cur-mousedown',
            'cur-skypemousewheel', // TODO ?
            'col-focus', 'col-blur', 'col-keydown', 'col-mousemove', 'col-mousedown'
        ];
        return ignoreEvents.indexOf(type) > -1;
    }
    /**
     * Set previous state of the Sense History
     *
     * @param {{url: String, tabId: Number, windowId: Number, node: SenseNode, wasClick: Boolean|Undefined}} state
     */
    set previousState(state) {
        if (typeof state == 'object') {
            this._previousState.url = state.url;
            this._previousState.tabId = state.tabId ? state.tabId : state.id;
            this._previousState.windowId = state.windowId;
            this._previousState.node = state.node;
            if (state.wasClick == undefined) {
                delete this._previousState.wasClick;
            } else {
                this._previousState.wasClick = state.wasClick;
            }
            if (this.options.markLastNodes) {
                this.putQueue(state.node);
            }
        } else {
            throw 'Use an object to set the property previousState';
        }
    }
    /**
     * Get the previous state of the Sense History
     *
     * @returns {{url: String, tabId: Number, windowId: Number, node: SenseNode, wasClick: Boolean|Undefined}}
     */
    get previousState() {
        return this._previousState;
    }
    /**
     * Set the previous url into the previous state of the Sense History and clear the fields tabId and windowId
     *
     * @param {String} url
     */
    set prevUrl(url) {
        if (typeof url == 'string') {
            this._previousState.url = url;
            this._previousState.tabId = undefined;
            this._previousState.windowId = undefined;
        }
    }
    /**
     * Get the previous url of the Sense History
     *
     * @returns {String} url
     */
    get prevUrl() {
        return this._previousState.url;
    }
    /**
     * Check the previous state.
     *
     * @returns {Boolean}
     */
    hasPreviousState() {
        return !!this._previousState.url;
    }
    /**
     * Turn all the highlights off
     *
     * @param {Boolean} [dataUpdated]
     */
    turnHighlightsOff(dataUpdated) {
        this.senseNodes.forEach(node => { node.highlighted = false; });
        // to compatibility with the old system
        this.actions.forEach(node => { node.highlighted = false; });
        if (dataUpdated) {
            this.dispatch.dataChanged('highlighted');
        }
    }
    /**
     * Check all the node to equivalence info.url to info.tabId and info.windowId
     * If there is no equivalence in the found nodes then unset the fields info.tabId and info.windowId
     *
     * @param {{url: String, tabId: Number, windowId: Number, id: Number}} info
     * @param {SenseNode} node
     */
    cleanSetTabIdWindowId(info, node) {
        var history = this,
            tabId = info.id ? info.id : info.tabId, nodes;
        if (!(tabId && info.windowId)) {
            return;
        }
        // Get all the node
        nodes = this.lookupNodesByTab({tabId: tabId, windowId: info.windowId});
        // check and fix all the nodes
        nodes.forEach(node => {
            if (node.url != info.url) {
                node.tabId = undefined;
                node.windowId = undefined;
                history.console.trace('cleanSetTabIdWindowId: cleaned tabId and windowId for the node with the url ' + node.url);
            }
        });
        node.tabId = tabId; node.windowId = info.windowId;
    }
    /**
     * Handle an event of update in the active tab
     *
     * @param {Number} tabId
     * @param {Object} tab
     */
    onActiveTabUpdate(tabId, tab) {
        var history = this,
            logInfo = 'onActiveTabUpdate[' + [tabId, tab.windowId].join(':') + ']: ',
            currentState;
        history.console.log(logInfo + 'started with the params ', tab);
        // turn all the highlighted nodes
        history.turnHighlightsOff(true);
        currentState = {url: tab.url, tabId: tabId, windowId: tab.windowId, node: undefined};
        // Either add new action or update it (with favIconUrl)
        var action = history.lookupNode(tab.url),
            transactionId = history.transactionSystem.lookup(tab, false);
        if (action) {
            let forceUpdate = action.isSearchEngine || !action.seen;
            history.updateNode(action, tab, {forceUpdateSnapshot: forceUpdate});
            history.tabs.updTab(tab);
            history.transactionSystem.finish(action);
            history.tasks.run(action.url);
            history.console.log(logInfo + 'only update the node: ', action);
        } else if (transactionId >= 0) {
            history.console.log(logInfo + 'finished the transaction ' + transactionId);
            action = history.finishTransaction(tab, transactionId);
        } else if (history.isSamePreviousTab(tab)) {
            history.updateInTheSameTab(tab);
        } else {
            // Action is more important than visit type
            let operation = SenseURL.extractUserAction(history.prevUrl, tab.url);
            history.console.info(logInfo, JSON.stringify(operation), history.previousState);
            if (operation) {
                if (operation === 'skip') {
                    return;
                } else if (SenseNode.isSearchType(operation.type)) {
                    // Search action can have referrer coming from a link
                    tab.title = operation.label;
                    history.createdNodeUpdateStatus(tab, history.previousState.node);
                } else {
                    let leader = history.lookupNode(history.prevUrl);
                    history.createdNodeUpdateStatus(tab, leader, node => {
                        // Set the original page of the filter
                        if (operation.type === 'filter' && node && leader) {
                            node.from = leader.type === 'filter' ? leader.from : leader.id;
                        }
                    });
                }
            } else {
                history.createdNodeUpdateStatus(tab, null);
            }
        }
        if (action) {
            currentState.node = action;
            history.previousState = currentState;
        }
    }
    /**
     * Handle an event of update in the inactive tab
     *
     * @param {Number} tabId
     * @param {Object} tab
     */
    onInactiveTabUpdate(tabId, tab) {
        var history = this,
            logInfo = 'onInactiveTabUpdate[' + [tabId, tab.windowId].join(':') + ']: ',
            action, actions, transactionId;
        history.console.log(logInfo + 'started with the params ', tab);
        action = history.lookupNode(tab.url);
        transactionId = history.transactionSystem.lookup(tab, false);
        // set the below condition to transactionId == -1 if you want to get dump of the transaction system
        if (transactionId == -2) {
            history.console.log(logInfo + ' a transaction is not found. Transactions are: ',
                history.transactionSystem.dumpTransactionSystem()
            );
        }
        // Lookup node using by tabId and windowId if the tab is not active and a transaction is not found
        actions = history.lookupNodesByTab(tab);
        if (action) {
            history.updateNode(action, tab, {noSnapshots: true});
            history.tabs.updTab(tab);
            history.transactionSystem.finish(action);
            history.console.log(logInfo + 'only update the node ', action);
        } else if (transactionId >= 0) {
            history.console.log(logInfo + 'finished the transaction ' + transactionId);
            history.finishTransaction(tab, transactionId);
        } else if (actions.length && !actions[0].seen) {
            history.updateNode(actions[0], tab, {skipUrl: false});
            history.tabs.updTab(tab);
            history.console.log(logInfo + 'updated the found node ', actions[0]);
        } else {
            history.console.log(logInfo + ' creating a node for the url ' + tab.url, JSON.stringify(tab));
            history.getTypeAndCreateNode(tab, null, node => {
                history.console.log(logInfo + 'created a node in the inactive tab ', node);
            });
        }
    }
    /**
     * Check a new event which is risen at the same tab
     *
     * @param {Object} tab
     * @returns {Boolean}
     */
    isSamePreviousTab(tab) {
        var isFillPreviousState = !(typeof this.previousState.tabId == 'undefined'
                || typeof this.previousState.windowId == 'undefined'),
            currentState = {tabId: tab.tabId ? tab.tabId : tab.id, windowId: tab.windowId},
            result = isFillPreviousState
                && this.previousState.tabId == currentState.tabId
                && this.previousState.windowId == currentState.windowId;
        return result;
    }
    /**
     * Do steps if the update makes in the same tab from the previous event
     *
     * @param {Object} tab
     * @param {Function} [callback](SenseNode)
     */
    updateInTheSameTab(tab, callback) {
        var history = this, node, nodes = history.lookupNodesByTab(tab),
            logInfo = 'updateInTheSameTab[' + [tab.id, tab.windowId].join(':') + ']: ';
        if (nodes.length) {
            node = nodes[nodes.length - 1];
        } else {
            node = history.previousState.node;
        }
        history.console.log(logInfo + 'detected the same previous tab ', tab, node);
        history.tabs.updTab(tab);
        // check if there is redirect action in this tab
        if (node) {
            node.seen = true;
            // make analyse if the current url is a filter to the previous url
            let operation = SenseURL.extractUserAction(history.previousState.url, tab.url);
            if (operation && operation.type == 'filter') {
                let filter = history.createFilterNode(tab, node);
                history.console.log(logInfo + 'created a filter ', node);
            } else {
                let searchEngine = SenseURL.detectSearchEngine(tab.url),
                    justUpdate = searchEngine && node
                        && node.isSearch()
                        && searchEngine.type == node.type && searchEngine.type != 'search';
                // console.log(logInfo, searchEngine, node);
                // Check if google map is panning or zooming
                if (justUpdate) {
                    let forceUpdate = node.isSearchEngine || !node.seen;
                    history.updateNode(node, tab, {
                        skipUrl: false, title: searchEngine.label, forceUpdateSnapshot: forceUpdate
                    });
                } else {
                    this.createdNodeUpdateStatus(tab, node, callback);
                }
            }
            if (typeof callback == 'function') {
                callback(node);
            }
            // Here is not updating the previous state
        } else {
            this.createdNodeUpdateStatus(tab, null, callback);
        }
    }
    /**
     * Activate existed tab with the node
     *
     * @param {SenseNode} node
     * @param {Object} tab
     * @param {Function} [callback]
     */
    clickNodeExistedTab(node, tab, callback) {
        // Found it, tell content script to scroll to the element
        chrome.tabs.update(tab.id, {active: true});
        chrome.tabs.sendMessage(tab.id, {type: 'scrollToElement', path: node.path, image: node.image});

        // Get the tab/window in focused as well
        chrome.windows.update(tab.windowId, {focused: true});
        // Added a new tab to SenseHistory.tabs and emulate the event onTabActivated
        this.tabs.addTab(tab);
        this.onTabActivated({tabId: tab.id, windowId: tab.windowId}, callback);
    }
    /**
     * Generate new id to the senseHistory
     */
    generateNewId() {
        this.id = d3.time.format('%Y%m%d%H%M%S')(new Date());
    }
}
