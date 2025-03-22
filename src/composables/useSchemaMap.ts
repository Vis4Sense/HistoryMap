import type { HmPage } from '@/types/historymap'
import type { Concept, Schema, SchemaNode } from '@/types/schema.d'
import _ from 'lodash'
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

  // SchemaMap nodes
  const rawNodes = computed(() => [...pages.value, ...schemaNodes.value])
  const nodes = computed(() => linkConcepts(rawNodes.value))

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
    rawNodes,
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

export function useLinkMap() {
  // map nodes to sources and targets
  const sourceMap = new Map<string, string[]>()
  const targetMap = new Map<string, string[]>()

  const { rawNodes } = useSchemaMap()

  function addValue(map: Map<string, string[]>, key: string, value: string) {
    if (map.has(key)) {
      map.set(key, [...map.get(key)!, value])
    }
    else {
      map.set(key, [value])
    }
  }

  rawNodes.value.forEach((node) => {
    if (node.type === 'hm-page') {
      if (node.parentPageId) {
        addValue(sourceMap, node.id, node.parentPageId)
        addValue(targetMap, node.parentPageId, node.id)
      }
    }
    else if (node.type === 'schema') {
      node.sources.forEach((source) => {
        addValue(sourceMap, node.id, source)
        addValue(targetMap, source, node.id)
      })
    }
  })

  function hasPath(sourceId: string, targetId: string) {
    function dfs(source: string, target: string, visited: Set<string> = new Set()): boolean {
      if (source === target)
        return true

      if (visited.has(source))
        return false

      visited.add(source)

      const neighbors = targetMap.get(source) || []

      for (const neighbor of neighbors) {
        if (dfs(neighbor, target, visited)) {
          return true
        }
      }

      return false
    }
    return dfs(sourceId, targetId)
  }

  return {
    sourceMap,
    targetMap,
    hasPath,
  }
}

function forEachConcept(node: HmPage | SchemaNode, callback: (concept: Concept) => void) {
  if (node.type === 'hm-page' && node.annotations) {
    node.annotations.forEach((annotation) => {
      if (!annotation.schema)
        return
      annotation.schema.concepts.forEach(callback)
    })
  }
  else if (node.type === 'schema') {
    node.schema.concepts.forEach(callback)
  }
}

function createConceptMap(nodes: (HmPage | SchemaNode)[] = [], exclude: 'included' | 'unincluded' | null = null) {
  // which nodes include the concept
  const conceptMap = (function () {
    const map = new Map<string, string[]>()

    function addValue(map: Map<string, string[]>, key: string, value: string) {
      if (map.has(key)) {
        map.set(key, _.uniq([...map.get(key)!, value]))
      }
      else {
        map.set(key, [value])
      }
    }

    return {
      set: (key: string, value: string) => {
        addValue(map, key.toLowerCase(), value)
      },
      get: (key: string) => {
        return map.get(key.toLowerCase())
      },
      has: (key: string) => {
        return map.has(key.toLowerCase())
      },
      keys: () => {
        return map.keys()
      },
    }
  }())

  nodes.forEach((node) => {
    forEachConcept(node, (concept) => {
      if (exclude) {
        if (concept[exclude]) {
          return
        }
      }
      conceptMap.set(concept.name, node.id)
    })
  })

  return {
    conceptMap,
  }
}

function linkConcepts(nodes: (HmPage | SchemaNode)[]) {
  const { activePage } = useHistoryMap()
  const { hasPath, targetMap } = useLinkMap()

  let { conceptMap } = createConceptMap(nodes)

  const processedNodes = _.cloneDeep(nodes)
  function getNode(id: string) {
    return processedNodes.find(d => d.id === id)
  }

  function highlightConcept(node: HmPage | SchemaNode, conceptName: string, attr: 'highlighted' | 'included' | 'unincluded' = 'highlighted') {
    forEachConcept(node, (concept) => {
      if (concept.name.toLowerCase() === conceptName.toLowerCase()) {
        concept[attr] = true
      }
    })
  }

  function highlightRelatedConcepts(node: HmPage | SchemaNode, conceptName: string) {
    const relatedNodeIds = conceptMap.get(conceptName)
    if (relatedNodeIds) {
      relatedNodeIds.forEach((relatedId) => {
        if (hasPath(node.id, relatedId) || hasPath(relatedId, node.id))
          return
        const relatedNode = getNode(relatedId)
        if (relatedNode) {
          highlightConcept(node, conceptName)
          highlightConcept(relatedNode, conceptName)
        }
      })
    }
  }

  // if concept is included in its target node
  processedNodes.forEach((node) => {
    forEachConcept(node, (concept) => {
      const targets = targetMap.get(node.id) || []
      const includes = conceptMap.get(concept.name) || []
      if (_.intersection(targets, includes).length > 0) {
        highlightConcept(node, concept.name, 'included')
      }
      else if (targets.length > 0) {
        highlightConcept(node, concept.name, 'unincluded')
      }
    })
  })

  conceptMap = createConceptMap(processedNodes, 'included').conceptMap

  // if no nodes are selected, suggest concepts related to the active page node
  if (selectedNodeIds.value.length === 0 && activePage.value) {
    const activeNode = getNode(activePage.value.id) as HmPage
    if (activeNode) {
      forEachConcept(activeNode, (concept) => {
        highlightRelatedConcepts(activeNode, concept.name)
      })
    }
  }

  // if a single node is selected, suggest concepts related to the selected node
  else if (selectedNodeIds.value.length === 1) {
    const selectedNode = getNode(selectedNodeIds.value[0])
    if (selectedNode) {
      forEachConcept(selectedNode, (concept) => {
        highlightRelatedConcepts(selectedNode, concept.name)
      })
    }
  }

  // if multiple nodes are selected, highlight their common concepts
  else if (selectedNodeIds.value.length > 1) {
    selectedNodeIds.value.forEach((id) => {
      const node = getNode(id)
      if (!node)
        return
      forEachConcept(node, (concept) => {
        const relatedNodeIds = conceptMap.get(concept.name)
        if (_.intersection(selectedNodeIds.value, relatedNodeIds).length > 1) {
          highlightConcept(node, concept.name)
        }
      })
    })
  }

  return processedNodes
}

export function getCurrentConcepts() {
  const { nodes } = useSchemaMap()
  const currentNodes = nodes.value.filter(d => !d.isMinimised)
  const { conceptMap } = createConceptMap(currentNodes, 'unincluded')
  const concepts = Array.from(conceptMap.keys())
  return concepts
}
