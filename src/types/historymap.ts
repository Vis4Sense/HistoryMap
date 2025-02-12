export interface HmSessionMetadata {
  sessionId: number
  time: number
  title: string
}

export interface HmSession extends HmSessionMetadata {
  pages: HmPage[]
}

export interface HmPage {
  sessionId: number
  pageId: string
  tabId: number
  time: number
  pageObj: PageObj
  parentPageId: string | null
}

/**
 * page object get from chrome.tabs
 * @see {@link https://developer.chrome.com/docs/extensions/reference/api/tabs#type-Tab}
 */
export interface PageObj {
  active: boolean
  audible: boolean
  autoDiscardable: boolean
  discarded: boolean
  favIconUrl: string
  groupId: number
  height: number
  highlighted: boolean
  id: number
  incognito: boolean
  index: number
  mutedInfo: {
    muted: boolean
  }
  pinned: boolean
  selected: boolean
  status: 'unloaded' | 'loading' | 'complete'
  title: string
  url: string
  width: number
  windowId: number
}
