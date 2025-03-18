import type { HmPage } from '@/types/historymap'
import type { ElementProvenance, Schema, SchemaNode } from '@/types/schema.d'
import { v4 as uuidv4 } from 'uuid'
import { useHistoryMap } from './useHistoryMap'
import { useSession } from './useSession'

const { data: allSchemaNodes } = useBrowserLocalStorage('schema-nodes', [] as SchemaNode[])
const { data: selectedNodeIds } = useBrowserLocalStorage('selected-node-ids', [] as string[])

export function useSchemaMap() {
  const { sessionId } = useSession()
  const { pages, links: hmLinks, updatePage } = useHistoryMap()

  /** define state */
  const schemaNodes = computed(() => allSchemaNodes.value.filter(d => d.sessionId === sessionId.value))

  const pageNodes = computed(() => {
    const pageProvDict: Record<string, ElementProvenance[]> = {}

    schemaNodes.value.forEach((node) => {
      const prov = node.schema.provenance ?? []
      prov.forEach((p) => {
        const src = p.sourcePage
        if (src) {
          if (src in pageProvDict === false) {
            pageProvDict[src] = []
          }
          pageProvDict[src].push(p)
        }
      })
    })

    return pages.value.map((p) => {
      const prov = pageProvDict[p.id]
      return prov ? { ...p, embeddedProvenance: prov } : p
    }) as HmPage[]
  })

  // SchemaMap nodes
  const nodes = computed(() => [...pageNodes.value, ...schemaNodes.value])

  // SchemaMap links
  const links = computed(() => {
    const schemaLinks = schemaNodes.value
      .filter(d => d.sources.length > 0) // using map on empty array will turn it into an object
      .flatMap(d => d.sources
        .map(src => ({ source: src, target: d.id })),
      )
      .filter(d => nodes.value.find(n => n.id === d.source) && nodes.value.find(n => n.id === d.target))
    return [...hmLinks.value, ...schemaLinks]
  })

  // Active schema node
  const activeSchemaNode = computed(() => schemaNodes.value.find(d => d.isActive))

  const state = {
    schemaNodes,
    nodes,
    links,
    activeSchemaNode,
    selectedNodeIds,
  }

  /** utilities */

  function newSchemaNode(schema: Schema | null = null): SchemaNode {
    deactivateAllSchemaNodes()

    const schema_ = schema ?? {
      schemaTree: {
        roots: [],
      },
      concepts: [],
      relations: [],
    }

    return {
      sessionId: sessionId.value,
      id: `sm-${uuidv4()}`,
      type: 'schema',
      schema: schema_,
      sources: [],
      timeCreated: Date.now(),
      timeUpdated: Date.now(),
      isActive: true,
    }
  }

  function deactivateAllSchemaNodes() {
    schemaNodes.value.forEach(node => node.isActive = false)
  }

  /** actions */

  function getNode(id: string) {
    return nodes.value.find(d => d.id === id)
  }

  function addSchemaNode(
    sources: string[] = [],
    initialise: 'empty' | 'copy' | 'merge' = 'empty',
  ) {
    let newNode = newSchemaNode()

    if (initialise === 'copy' && sources.length > 0) {
      const srcNode = getNode(sources[0])
      newNode = newSchemaNode(srcNode?.schema ?? null)
    }

    newNode.sources = sources
    allSchemaNodes.value = [...allSchemaNodes.value, newNode]
  }

  function updateNode(id: string, data: Partial<SchemaNode | HmPage>) {
    if (id.startsWith('sm-')) {
      const node = allSchemaNodes.value.find(d => d.id === id)
      if (node) {
        if (data.isActive) {
          deactivateAllSchemaNodes()
        }
        Object.assign(node, data)
        node.timeUpdated = Date.now()
      }
    }
    else {
      updatePage(id, data as HmPage)
    }
  }

  function removeNode(id: string) {
    const idx = allSchemaNodes.value.findIndex(d => d.id === id)
    if (idx >= 0) {
      allSchemaNodes.value.splice(idx, 1)
    }
  }

  function updateSchema(id: string, newSchema: Schema) {
    updateNode(id, { schema: newSchema })
  }

  function setSelectedNodeIds(selection: string[]) {
    selectedNodeIds.value = [...selection]
    console.log('selected nodes', selectedNodeIds.value)
  }

  function addSourceToNode(nodeId: string, sourceId: string) {
    const node = allSchemaNodes.value.find(d => d.id === nodeId)
    if (node) {
      if (node.sources.includes(sourceId) === false) {
        node.sources.push(sourceId)
      }
    }
  }

  /** initialise */
  function initialise() {
    // initial schema node
    // if (schemaNodes.value.length === 0) {
    //   allSchemaNodes.value = [...allSchemaNodes.value, newSchemaNode()]
    // }
  }

  initialise()
  watch(sessionId, () => {
    initialise()
  })

  return {
    ...state,
    getNode,
    deactivateAllSchemaNodes,
    addSchemaNode,
    updateNode,
    removeNode,
    updateSchema,
    setSelectedNodeIds,
    addSourceToNode,
  }
}
