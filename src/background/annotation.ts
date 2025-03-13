/**
 * @see {@link https://github.com/serversideup/webext-bridge}
 *
 * document
 * @see {@link https://serversideup.net/open-source/webext-bridge/docs}
 */

import type { Annotation } from '@/types/historymap'
import { useHistoryMap } from '@/composables/useHistoryMap'
import { onMessage } from 'webext-bridge/background'
import { updateActivePage } from './controller'

const { activePage, addAnnotation, removeHighlight, highlight, addTag, removeTag } = useHistoryMap()

onMessage('fetch-annotations', () => {
  updateActivePage()
  return activePage.value?.annotations || []
})

onMessage('highlight', ({ data }) => {
  const { id, selection, sourceText } = data as {
    id: number
    selection: string
    sourceText: string
  }
  if (activePage.value) {
    let annotation = activePage.value.annotations?.find(d => d.id === id) || null
    if (annotation) {
      highlight(activePage.value.id, id)
    }
    else {
      annotation = addAnnotation(
        activePage.value.id,
        id,
        selection,
        sourceText,
        true,
      )
    }
    if (annotation) {
      return annotation
    }
  }
  return null
})

onMessage('dehighlight', ({ data }) => {
  if (activePage.value) {
    const annotation = data as Annotation
    removeHighlight(activePage.value.id, annotation.id)
  }
  return true
})

onMessage('annotate', ({ data }) => {
  if (activePage.value) {
    const { id, selection, sourceText } = data as {
      id: number
      selection: string
      sourceText: string
    }
    const annotation = addAnnotation(activePage.value.id, id, selection, sourceText, false)
    if (annotation) {
      return annotation
    }
  }
  return null
})

onMessage('add-tag', ({ data }) => {
  if (activePage.value) {
    console.log('add-tag', data)
    const { id, tag } = data as { id: number, tag: string }
    const annotation = addTag(activePage.value.id, id, tag)
    return annotation
  }
  return null
})

onMessage('remove-tag', ({ data }) => {
  if (activePage.value) {
    const { id, tag } = data as { id: number, tag: string }
    const annotation = removeTag(activePage.value.id, id, tag)
    return annotation
  }
  return null
})
