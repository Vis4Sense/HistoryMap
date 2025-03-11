/**
 * @see {@link https://github.com/serversideup/webext-bridge}
 *
 * document
 * @see {@link https://serversideup.net/open-source/webext-bridge/docs}
 */

import { useHistoryMap } from '@/composables/useHistoryMap'
import { onMessage } from 'webext-bridge/background'
import { updateActivePage } from './controller'
import { Annotation } from '@/types/historymap'

const { activePage, addAnnotation, removeHighlight } = useHistoryMap()

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
    const annotation = addAnnotation(
      activePage.value.id,
      id,
      selection,
      sourceText,
      true,
    )
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
