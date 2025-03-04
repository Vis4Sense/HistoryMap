/** controller of the schemas displayed in schema panel */
import { useHistoryMap } from './useHistoryMap'
import { useSchemaMap } from './useSchemaMap'

export function useSchemaPanel() {
  const { activePage } = useHistoryMap()
  const { activeSchemaNode } = useSchemaMap()

  const nodeSyncState = ref<Record<string, boolean>>({})

  // By default, contains active page + active schema node
  const visibleNodes = computed(() => {
    const nodes = []
    if (activePage.value) {
      nodes.push(activePage.value)
    }
    if (activeSchemaNode.value) {
      nodes.push(activeSchemaNode.value)
    }

    return nodes.map(node => {
      if (!nodeSyncState.value[node.id]) {
        nodeSyncState.value[node.id] = true
      }
      return { ...node, sync: nodeSyncState.value[node.id] }
    })
  })

  const state = {
    visibleNodes,
  }

  return {
    ...state,
  }
}
