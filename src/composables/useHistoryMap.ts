import type { HmPage } from '~/types/historymap'
import { v4 as uuidv4 } from 'uuid'
import { useBrowserLocalStorage } from './useBrowserStorage'
import { useSession } from './useSession'

function getLinks(pages: HmPage[]) {
  return pages
    .filter(d => d.parentPageId)
    .map(d => ({ source: d.parentPageId!, target: d.id }))
}

export function useHistoryMap() {
  const { sessionId, session, updateSession } = useSession()

  /** define state */
  const { data: hmPages } = useBrowserLocalStorage('hm-pages', [] as HmPage[])

  const pages = computed(() => hmPages.value.filter(d => d.sessionId === sessionId.value))
  const links = computed(() => getLinks(pages.value))

  const state = {
    pages,
    links,
  }

  /** utilities */

  function newPage(tab: chrome.tabs.Tab, parentPageId: string | null = null): HmPage | null {
    return {
      sessionId: sessionId.value,
      id: `hm-${uuidv4()}`,
      tabId: tab.id!,
      type: 'hm-page',
      timeCreated: Date.now(),
      timeLastActivated: Date.now(),
      pageObj: tab,
      parentPageId,
      isActive: tab.active,
    }
  }

  function deactivateAllPages() {
    hmPages.value.filter(d => d.sessionId === sessionId.value)
      .forEach(page => page.isActive = false)
  }

  /** actions */

  function addPage(tab: chrome.tabs.Tab, parentPageId: string | null = null) {
    if (!tab.id) {
      console.error('invalid tab id', tab)
      return null
    }

    const page = newPage(tab, parentPageId)
    if (page) {
      if (page.isActive)
        deactivateAllPages()
      if (!session.value?.title && page.pageObj.title) {
        updateSession(sessionId.value, { title: page.pageObj.title })
      }
      hmPages.value = [...hmPages.value, page]
    }

    // console.log('added page', page)
  }

  function updatePage(pageId: string, data: Partial<HmPage>) {
    const page = hmPages.value.find(d => d.id === pageId)
    if (page) {
      if (data.isActive)
        deactivateAllPages()
      Object.assign(page, data)
    }
  }

  function removePage(pageId: string, removeChildren = false) {
    const page = hmPages.value.find(d => d.id === pageId)
    if (page) {
      if (removeChildren) {
        // remove its children
        hmPages.value
          .filter(d => d.parentPageId === pageId)
          .forEach(d => removePage(d.id, true))
      }
      else {
        // connect its children to its parent
        hmPages.value
          .filter(d => d.parentPageId === pageId)
          .forEach(d => d.parentPageId = page.parentPageId)
      }

      // remove the page
      const index = hmPages.value.indexOf(page)
      hmPages.value.splice(index, 1)
    }
  }

  return {
    ...state,
    addPage,
    updatePage,
    removePage,
  }
}
