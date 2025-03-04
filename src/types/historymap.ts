export interface HmPage {
  sessionId: number
  id: string // hm-uuid
  tabId: number
  type: 'hm-page'
  timeCreated: number
  timeLastActivated: number
  pageObj: chrome.tabs.Tab
  parentPageId: string | null
  isActive: boolean
}
