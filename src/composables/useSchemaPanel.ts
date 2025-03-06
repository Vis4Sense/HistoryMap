import { useHistoryMap } from './useHistoryMap'
import { useSchemaMap } from './useSchemaMap'

const { activePage } = useHistoryMap()
const { deactivateAllSchemaNodes } = useSchemaMap()

export function useSchemaPanel() {
  const activePane = ref('extract')

  // Source historymap page of the active schema node
  const sourcePage = computed(() => activePane.value === 'extract' ? activePage.value : null)

  const state = {
    activePane,
    sourcePage,
  }

  function switchPane(pane: string) {
    // deactivate schema nodes if switched to synthesise pane (so that all nodes are read-only)
    if (pane === 'synthesize') {
      deactivateAllSchemaNodes()
    }
    activePane.value = pane
  }

  return {
    ...state,
    switchPane,
  }
}
