/** controller of the schemas displayed in schema panel */
import { useHistoryMap } from './useHistoryMap'
import { useSchemaMap } from './useSchemaMap'

export function useSchemaPanel() {
  const { activePage } = useHistoryMap()
  const { activeSchemaNode } = useSchemaMap()

  // By default, contains active page + active schema node
  const visibleNodes = computed(() => [
    ...(activePage.value ? [activePage.value] : []),
    ...(activeSchemaNode.value ? [activeSchemaNode.value] : []),
  ])

  const state = {
    visibleNodes,
  }

  return {
    ...state,
  }
}
