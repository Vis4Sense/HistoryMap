import type { SchemaNode } from '@/types/schema'
import { v4 as uuidv4 } from 'uuid'
import { useHistoryMap } from './useHistoryMap'
import { useSession } from './useSession'

export function useSchemaMap() {
  const { sessionId } = useSession()
  const { pages, links: hmLinks } = useHistoryMap()

  /** define state */
  const { data: allSchemaNodes } = useBrowserLocalStorage('schemas', [] as SchemaNode[])

  const schemaNodes = computed(() => allSchemaNodes.value.filter(d => d.sessionId === sessionId.value))

  const nodes = computed(() => [...pages.value, ...schemaNodes.value])
  const links = computed(() => {
    const schemaLinks = schemaNodes.value
      .flatMap(d => d.sources.map(src => ({ source: src, target: d.id })))
    return [...hmLinks.value, ...schemaLinks]
  })

  const state = {
    schemaNodes,
    nodes,
    links,
  }

  /** utilities */

  function newSchemaNode(): SchemaNode {
    return {
      sessionId: sessionId.value,
      id: `sm-${uuidv4()}`,
      type: 'schema',
      schema: {
        schemaTree: {
          roots: [],
        },
        nodes: [],
        links: [],
      },
      sources: [],
      timeCreated: Date.now(),
      timeUpdated: Date.now(),
      isActive: true,
    }
  }

  /** initialise */
  function initialise() {
    // initial schema node
    if (schemaNodes.value.length === 0) {
      allSchemaNodes.value.push(newSchemaNode())
    }
  }

  initialise()

  return {
    ...state,
  }
}
