/**
 * @fileoverview Controller of history map data, i.e., sessions and pages.
 */
import { useHistoryMap } from "@/composables/useHistoryMap"
import { HmPage } from "@/types/historymap"

const { session, addSession, addPage, updatePage } = useHistoryMap()

chrome.tabs.onCreated.addListener(tabCreationHandler)
chrome.tabs.onUpdated.addListener(tabUpdateHandler)

function tabCreationHandler(tab: chrome.tabs.Tab) {
  console.log('tab created', tab)

  if (!session.value) addSession()

  let parent: HmPage | null = null
  if (tab.openerTabId) {
    parent = session.value?.pages
        .sort((a, b) => b.timeLastActivated - a.timeLastActivated)
        .find(page => page.tabId === tab.openerTabId)
      || null
  }

  addPage(tab, parent?.pageId || null)
}

function tabUpdateHandler(tabId: number, changeInfo: Partial<chrome.tabs.Tab>, tab: chrome.tabs.Tab) {
  console.log('tab updated', tabId, changeInfo, tab)
  
  // the page to update
  let page: HmPage | undefined

  // if the tab is loading
  if (changeInfo.status === 'loading' && changeInfo.url) {
    page = session.value?.pages.find(
      page => page.tabId === tabId
      && (page.pageObj.status === 'unloaded'
        || page.pageObj.pendingUrl === changeInfo.url)
    )
    // if there is an unloaded or pending page, update the url
    if (page) {
      page.pageObj.url = changeInfo.url
      page.pageObj.status = 'loading'
      updatePage(page.pageId, page)
    }
    // go back or create a new page
    else {
      const prior = session.value?.pages.find(
        page => page.tabId === tabId
        && page.pageObj.url === changeInfo.url
      )
      if (prior) {
        prior.pageObj.status = 'loading'
        prior.timeLastActivated = Date.now()
        updatePage(prior.pageId, prior)
      }
      else {
        if (!session.value) addSession()
        const parent = session.value?.pages
            .sort((a, b) => b.timeLastActivated - a.timeLastActivated)
            .find(page => page.tabId === tabId)
          || null
        addPage(tab, parent?.pageId || null)
      }
    }
  }

  // title or favicon update
  if (changeInfo.title || changeInfo.favIconUrl) {
    page = session.value?.pages.find(
      page => page.tabId === tabId
      && page.pageObj.url === tab.url
    )
    if (page) {
      page.pageObj.title = tab.title
      page.pageObj.favIconUrl = tab.favIconUrl
      updatePage(page.pageId, page)
    }
  }

  // if a loaded tab is completed
  if (changeInfo.status === 'complete') {
    page = session.value?.pages.find(
      page => page.tabId === tabId
      && page.pageObj.status === 'loading'
    )
    if (page) {
      page.pageObj.status = 'complete'
      updatePage(page.pageId, page)
    }
  }
}

export function initialiseController() {
  console.info('start initialising controller')
  console.log('session', session.value)

  // only for debugging
  // const clearLocalStorage = true
  // if (clearLocalStorage) {
  //   chrome.storage.local.clear()
  // }
}
