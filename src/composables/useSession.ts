import type { SessionMetaData } from '@/types/session'

const { data: sessions } = useBrowserLocalStorage('hm-sessions', [] as SessionMetaData[])
const { data: sessionId } = useBrowserLocalStorage('hm-session-id', -1)

export function useSession() {
  /** define state */

  // active session
  const session = computed(() => sessions.value.find(d => d.sessionId === sessionId.value))

  const state = {
    sessions,
    sessionId,
    session,
  }

  /** utils */
  function newSession(title: string = ''): SessionMetaData {
    const id = sessions.value.length
    return {
      sessionId: id,
      time: Date.now(),
      title,
      timeCreated: Date.now(),
      timeUpdated: Date.now(),
    }
  }

  /** actions */
  function addSession(title: string = '') {
    const session_ = newSession(title)
    sessions.value = [...sessions.value, session_]
    sessionId.value = session_.sessionId
  }

  function updateSession(id: number, data: Partial<SessionMetaData>) {
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
  }
}
