import type { Annotation, HmPage } from '~/types/historymap'
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { useBrowserLocalStorage } from './useBrowserStorage'
import { useSession } from './useSession'

const { data: hmPages } = useBrowserLocalStorage('hm-pages', [] as HmPage[])

function getLinks(pages: HmPage[]) {
  return pages
    .filter(d => d.parentPageId)
    .map(d => ({ source: d.parentPageId!, target: d.id }))
}

export function useHistoryMap() {
  const { sessionId, session, updateSession } = useSession()

  /** define state */
  const pages = computed(() => hmPages.value.filter(d => d.sessionId === sessionId.value))
  const links = computed(() => getLinks(pages.value))

  // Active page
  const activePage = computed(() => pages.value.find(d => d.isActive))

  const state = {
    pages,
    links,
    activePage,
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

  function getPage(id: string) {
    return hmPages.value.find(d => d.id === id)
  }

  function isEmptyAnnotation(annotation: Annotation) {
    if (!annotation.tags)
      return true
    if (annotation.tags.length === 0)
      return true
    return false
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
      if (data.isActive) {
        deactivateAllPages()
        data.timeLastActivated = Date.now()
      }
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

  function addAnnotation(
    pageId: string,
    id: number,
    selection: string,
    sourceText: string,
    highlighted: boolean = false,
  ) {
    const page = getPage(pageId)
    if (!page)
      return
    if (!page.annotations)
      page.annotations = []
    // const id = _.max(page.annotations.map(d => d.id + 1)) || 0
    const annotation = {
      id,
      selection,
      sourceText,
      highlighted,
      timeCreated: Date.now(),
      timeUpdated: Date.now(),
    }
    page.annotations.push(annotation)
    console.log('added annotation', annotation)
    return annotation
  }

  function removeHighlight(
    pageId: string,
    id: number,
  ) {
    const page = getPage(pageId)
    if (!page || !page.annotations)
      return
    const index = page.annotations.findIndex(d => d.id === id)
    if (index !== undefined && index >= 0) {
      const annotation = page.annotations[index]
      if (isEmptyAnnotation(annotation)) {
        page.annotations?.splice(index, 1)
      }
      else {
        annotation.highlighted = false
      }
    }
  }

  function getAnnotation(
    pageId: string,
    id: number,
  ) {
    const page = getPage(pageId)
    if (!page)
      return null
    return page.annotations?.find(d => d.id === id) || null
  }

  return {
    ...state,
    addPage,
    updatePage,
    removePage,
    addAnnotation,
    getAnnotation,
    removeHighlight,
  }
}
