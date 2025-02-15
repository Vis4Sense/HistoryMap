import { v4 as uuidv4 } from 'uuid'
import { useBrowserLocalStorage } from "./useBrowserStorage"
import type { HmPage, HmSession, HmSessionMetadata } from '~/types/historymap'

interface HistoryMapState {
  sessionId: Ref<number>
  session: ComputedRef<HmSession | null>
}

function getSessionData(
  sessionId: number, 
  sessions: HmSessionMetadata[], 
  hmPages: HmPage[]
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
  }

  /** utilities */

  function newSession(): HmSessionMetadata {
    const id = sessions.value.length
    return { sessionId: id, time: Date.now(), title: 'New session' }
  }

  function newPage(tab: chrome.tabs.Tab, parentPageId: string | null = null): HmPage | null {
    // if new page is in the active tab, set other pages to inactive
    if (tab.active) {
      session.value?.pages.forEach(page => page.isActive = false)
    }

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

  /** actions */
  function addSession() {
    const session_ = newSession()
    sessions.value = [...sessions.value, session_]
    sessionId.value = session_.sessionId
    // console.log('added session', session_, sessionId.value)
  }

  function addPage(tab: chrome.tabs.Tab, parentPageId: string | null = null) {
    if (!tab.id) {
      console.error('invalid tab id', tab)
      return null
    }

    const page = newPage(tab, parentPageId)
    if (page) hmPages.value = [...hmPages.value, page]

    // console.log('added page', page)
  }

  return {
    ...state,
    addSession,
    addPage,
  }
}
