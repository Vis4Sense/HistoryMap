import type { HmPage, HmSession, HmSessionMetadata } from '~/types/historymap'
import { v4 as uuidv4 } from 'uuid'
import { useBrowserLocalStorage } from './useBrowserStorage'

interface HistoryMapState {
  sessionId: Ref<number>
  session: ComputedRef<HmSession | null>
  sessions: Ref<HmSessionMetadata[]>
}

function getSessionData(
  sessionId: number,
  sessions: HmSessionMetadata[],
  hmPages: HmPage[],
): HmSession | null {
  const metadata = (sessions ?? []).find(d => d.sessionId === sessionId)
  const pages = (hmPages ?? []).filter(d => d.sessionId === sessionId)
  return metadata ? { ...metadata, pages } as HmSession : null
}

export function useHistoryMap() {
  /** define state */
  const { data: sessions } = useBrowserLocalStorage('hm-sessions', [] as HmSessionMetadata[])
  const { data: hmPages } = useBrowserLocalStorage('hm-pages', [] as HmPage[])
  const { data: sessionId } = useBrowserLocalStorage('hm-session-id', -1)
  const session = computed(() => getSessionData(sessionId.value, sessions.value, hmPages.value))

  const state: HistoryMapState = {
    sessionId,
    session,
    sessions,
  }

  /** utilities */

  function newSession(title: string = ''): HmSessionMetadata {
    const id = sessions.value.length
    return {
      sessionId: id,
      time: Date.now(),
      title,
      timeCreated: Date.now(),
      timeUpdated: Date.now(),
    }
  }

  function newPage(tab: chrome.tabs.Tab, parentPageId: string | null = null): HmPage | null {
    return {
      sessionId: sessionId.value,
      pageId: uuidv4(),
      tabId: tab.id!,
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
  function addSession(title: string = '') {
    const session_ = newSession(title)
    sessions.value = [...sessions.value, session_]
    sessionId.value = session_.sessionId
  }

  function updateSession(id: number, data: Partial<HmSessionMetadata>) {
    const session_ = sessions.value.find(d => d.sessionId === id)
    if (session_)
      Object.assign(session_, data)
  }

  function switchSession(id: number) {
    sessionId.value = id
  }

  function switchToDefaultSession() {
    switchSession(0)
  }

  function switchToLatestSession() {
    let latestestId = 0
    if (sessions.value.length > 1) {
      const latest = sessions.value
        .filter(d => d.sessionId !== 0)
        .sort((a, b) => b.timeUpdated - a.timeUpdated)[0]
      latestestId = latest.sessionId
    }
    switchSession(latestestId)
  }

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
    const page = hmPages.value.find(d => d.pageId === pageId)
    if (page) {
      if (data.isActive)
        deactivateAllPages()
      Object.assign(page, data)
    }
  }

  function removePage(pageId: string, removeChildren = false) {
    const page = hmPages.value.find(d => d.pageId === pageId)
    if (page) {
      if (removeChildren) {
        // remove its children
        hmPages.value
          .filter(d => d.parentPageId === pageId)
          .forEach(d => removePage(d.pageId, true))
      } else {
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

  /** initialise */
  function initialise() {
    // the first session is the background session that captures
    // page history when no specific session is active
    if (!sessions.value.length)
      addSession('Default')
  }

  initialise()

  return {
    ...state,
    addSession,
    updateSession,
    switchSession,
    switchToDefaultSession,
    switchToLatestSession,
    addPage,
    updatePage,
    removePage,
  }
}
