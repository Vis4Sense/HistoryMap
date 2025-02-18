/**
 * @fileoverview Controller of history map data, i.e., sessions and pages.
 */

import type { HmPage } from '@/types/historymap'
import { useHistoryMap } from '@/composables/useHistoryMap'

const { session, switchToDefaultSession, switchToLatestSession, addPage, updatePage } = useHistoryMap()

/**
 * handle chrome.tabs.onCreated
 *
 * add a new page to historymap
 */
function tabCreationHandler(tab: chrome.tabs.Tab) {
  // console.log('tab created', tab)
  let parent: HmPage | null = null
  if (tab.openerTabId) {
    parent = session.value?.pages
      .sort((a, b) => b.timeLastActivated - a.timeLastActivated)
      .find(page => page.tabId === tab.openerTabId)
      || null
  }

  addPage(tab, parent?.pageId || null)
}

/**
 * handle chrome.tabs.onUpdated
 *
 * possible behaviour:
 *   - page information updated during loading: update the page object
 *   - url update due to navigation (within the same tab)
 *      - capture as go back if the url is previously visited
 *      - create a new page if the url is new
 */
function tabUpdateHandler(tabId: number, changeInfo: Partial<chrome.tabs.Tab>, tab: chrome.tabs.Tab) {
  // console.log('tab updated', tabId, changeInfo, tab)

  // the page to update
  let page: HmPage | undefined

  // if the tab is loading
  if (changeInfo.status === 'loading' && changeInfo.url) {
    page = session.value?.pages.find(
      page => page.tabId === tabId
        && (page.pageObj.status === 'unloaded'
          || page.pageObj.pendingUrl === changeInfo.url),
    )
    // if there is an unloaded or pending page, update the url
    if (page) {
      page.pageObj.url = changeInfo.url
      page.pageObj.status = 'loading'
      updatePage(page.pageId, { pageObj: page.pageObj })
    }
    // go back or create a new page
    else {
      const prior = session.value?.pages.find(
        page => page.tabId === tabId
          && page.pageObj.url === changeInfo.url,
      )
      if (prior) {
        prior.pageObj.status = 'loading'
        updatePage(prior.pageId, {
          pageObj: prior.pageObj,
          timeLastActivated: Date.now(),
          isActive: true,
        })
      }
      else {
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
        && page.pageObj.url === tab.url,
    )
    if (page) {
      page.pageObj.title = tab.title
      page.pageObj.favIconUrl = tab.favIconUrl
      updatePage(page.pageId, { pageObj: page.pageObj })
    }
  }

  // if a loaded tab is completed
  if (changeInfo.status === 'complete') {
    page = session.value?.pages.find(
      page => page.tabId === tabId
        && page.pageObj.status === 'loading',
    )
    if (page) {
      page.pageObj.status = 'complete'
      updatePage(page.pageId, { pageObj: page.pageObj })
    }
  }
}

/**
 * handle chrome.tabs.onActivated
 *
 * set the activated page as active
 */
function tabActivateHandler(activeInfo: { tabId: number }) {
  const pagesIntab = session.value?.pages
    .filter(page => page.tabId === activeInfo.tabId)
    .sort((a, b) => b.timeLastActivated - a.timeLastActivated)
  if (pagesIntab && pagesIntab.length) {
    const page = pagesIntab[0]
    updatePage(page.pageId, {
      timeLastActivated: Date.now(),
      isActive: true,
    })
  }
  // if page not found, create a new node
  else {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab) {
        addPage(tab, null)
      }
    })
  }
}

export function initialiseController() {
  chrome.tabs.onCreated.addListener(tabCreationHandler)
  chrome.tabs.onUpdated.addListener(tabUpdateHandler)
  chrome.tabs.onActivated.addListener(tabActivateHandler)

  /** switch to default session when historymap is not opened */
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'historymap') {
      switchToLatestSession()
      port.onDisconnect.addListener(() => {
        switchToDefaultSession()
      })
    }
  })

  // only for debugging
  // const clearLocalStorage = true
  // if (clearLocalStorage) {
  //   chrome.storage.local.clear()
  // }
}
