import type { SchemaNode } from '@/types/schema'
import { v4 as uuidv4 } from 'uuid'
import { useSession } from './useSession'
import { useHistoryMap } from './useHistoryMap'

export function useSchemaMap() {
  const { sessionId } = useSession()
  const { pages } = useHistoryMap()

  /** define state */
  const { data: allSchemaNodes } = useBrowserLocalStorage('schemas', [] as SchemaNode[])

  const schemaNodes = computed(() => allSchemaNodes.value.filter(d => d.sessionId === sessionId.value))
  const nodes = computed(() => [...pages.value, ...schemaNodes.value])

  const state = {
    schemaNodes,
    nodes,
  }

  /** utilities */

  function newSchemaNode(): SchemaNode {
    return {
      sessionId: sessionId.value,
      uuid: `sm-${uuidv4()}`,
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
