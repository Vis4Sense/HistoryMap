import type { Schema } from './schema'

export interface HmPage {
  sessionId: number
  pageId: string // hm-uuid
  tabId: number
  timeCreated: number
  timeLastActivated: number
  pageObj: chrome.tabs.Tab
  parentPageId: string | null
  isActive: boolean
  schema?: Schema
}
