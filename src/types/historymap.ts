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
  timeCreated: number
  timeLastActivated: number
  pageObj: chrome.tabs.Tab
  parentPageId: string | null
  isActive: boolean
}
