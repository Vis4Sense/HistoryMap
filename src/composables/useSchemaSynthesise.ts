import { useSchemaMap } from './useSchemaMap'

const { nodes, activeSchemaNode, addSchemaNode } = useSchemaMap()

export function useSchemaSynthesise() {

  const visibleNodes = computed(() => nodes.value.filter(d => d.schema && d.schema.schemaTree.roots.length > 0))

  const state = {
    activeSchemaNode,
    visibleNodes,
  }

  function onSynthesise() {
    const sources = visibleNodes.value.map(d => d.id)
    addSchemaNode(sources)
  }

  return {
    ...state,
    onSynthesise,
  }
}
