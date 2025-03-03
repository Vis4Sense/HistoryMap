import type { Schema, SchemaNode } from '@/types/schema'
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { useHistoryMap } from './useHistoryMap'
import { useSession } from './useSession'

export function useSchemaMap() {
  const { sessionId } = useSession()
  const { pages, links: hmLinks } = useHistoryMap()

  /** define state */
  const { data: allSchemaNodes } = useBrowserLocalStorage('schema-nodes', [newSchemaNode()] as SchemaNode[])

  const schemaNodes = computed(() => allSchemaNodes.value.filter(d => d.sessionId === sessionId.value))

  // SchemaMap nodes
  const nodes = computed(() => [...pages.value, ...schemaNodes.value])

  // SchemaMap links
  const links = computed(() => {
    const schemaLinks = schemaNodes.value
      .filter(d => d.sources.length > 0) // using map on empty array will turn it into an object
      .flatMap(d => d.sources
        .map(src => ({ source: src, target: d.id })),
      )
    return [...hmLinks.value, ...schemaLinks]
  })

  // Active schema node
  const activeSchemaNode = computed(() => schemaNodes.value.find(d => d.isActive))

  const state = {
    schemaNodes,
    nodes,
    links,
    activeSchemaNode,
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
        concepts: [],
        relations: [],
      },
      sources: [],
      timeCreated: Date.now(),
      timeUpdated: Date.now(),
      isActive: true,
    }
  }

  /** actions */

  function updateSchema(id: string, newSchema: Schema) {
    const schemaNode = schemaNodes.value.find(d => d.id === id)
    if (schemaNode) {
      schemaNode.schema = newSchema
      schemaNode.timeUpdated = Date.now()
      console.info('schema updated', schemaNode)
    }
  }

  /** initialise */
  function initialise() {
    // initial schema node
    if (schemaNodes.value.length === 0) {
      allSchemaNodes.value = [...allSchemaNodes.value, newSchemaNode()]
    }
  }

  initialise()
  watch(sessionId, () => {
    initialise()
  })

  return {
    ...state,
    updateSchema,
  }
}
