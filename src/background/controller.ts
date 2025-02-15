/**
 * @fileoverview Controller of history map data, i.e., sessions and pages.
 */
import { useHistoryMap } from "@/composables/useHistoryMap"
import { HmPage } from "@/types/historymap"

const { sessionId, session, addSession, addPage } = useHistoryMap()

watch(session, (session) => {
  console.log('session changed', session)
})

chrome.tabs.onCreated.addListener(tabCreationHandler)

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log('tab updated', tabId, changeInfo, tab)
})

export function initialiseController() {
  console.info('start initialising controller')
  console.log('session', session.value)

  // only for debugging
  const clearLocalStorage = true
  if (clearLocalStorage) {
    chrome.storage.local.clear()
  }
}
