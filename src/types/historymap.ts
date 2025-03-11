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
  annotations?: Annotation[]
}

export interface Annotation {
  id: number
  selection: string // serialized selection
  sourceText: string
  highlighted: boolean
  tags?: string[]
  timeCreated: number
  timeUpdated: number
}
