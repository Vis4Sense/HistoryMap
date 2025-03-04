/** sync schemas among history page nodes and schema nodes */

import type { HmPage } from '@/types/historymap'
import type { Concept, ElementProvenance, SchemaNode } from '@/types/schema'
import { useSchemaEditor } from './useSchemaEditor'
import { useSchemaMap } from './useSchemaMap'
import { useSchemaPanel } from './useSchemaPanel'

interface Pair {
  sources: string[]
  targets: string[]
}

export function useSchemaSync() {
  const { visibleNodes } = useSchemaPanel()
  const { getNode: getSmNode, updateNode } = useSchemaMap()

  /** utilities */

  function getNode(id: string) {
    const node = getSmNode(id)
    if (!node) {
      console.error('node not found', id)
      return null
    }
    return node
  }

  // get paris of sources and targets
  function getSyncPairs(senderNode: HmPage | SchemaNode): Record<string, Pair[]> {
    const pairDict: Record<string, Pair[]> = {}

    function addPair(key: string, pair: Pair) {
      if (!pairDict[key]) {
        pairDict[key] = []
      }
      pairDict[key].push(pair)
    }

    // if sender node is schema node
    if (senderNode.id.startsWith('sm-')) {
      const sender = senderNode as SchemaNode

      // connect it to the page nodes if it isn't
      const pages = visibleNodes.value
        .filter(d => d.sync && d.id.startsWith('hm-'))
      pages.forEach((page) => {
        sender.sources = [...new Set([...sender.sources, page.id])]
      })
      updateNode(sender.id, { sources: sender.sources })

      // sync changes with its sources
      const sources = visibleNodes.value
        .filter(d => d.sync && sender.sources.includes(d.id))
        .map(d => d.id)

      const pair = { sources, targets: [sender.id] }
      for (const source of sources) {
        addPair(source, pair)
      }
      addPair(sender.id, pair)

      return pairDict
    }

    // TODO: if sender node is page node
    addPair(senderNode.id, { sources: [senderNode.id], targets: [] })
    return pairDict
  }

  /** Handle change commits */

  function commitAddRoot(sender: string, name: string) {
    const senderNode = getNode(sender)

    if (!senderNode)
      return

    const provenance: ElementProvenance<Concept> = {
      sources: [],
      targets: [],
      time: Date.now(),
      elementType: 'concept',
      changeType: 'add',
      diff: { old: null, new: null },
    }

    const pairDict = getSyncPairs(senderNode)

    for (const nodeId in pairDict) {
      const node = getNode(nodeId)
      if (!node) {
        continue
      }

      const pairs = pairDict[nodeId]
      const prov = pairs.map(pair => ({
        ...provenance,
        ...pair,
      }))
      const editor = useSchemaEditor(nodeId, node.schema)
      editor.addRoot({ name }, prov)
    }
  }

  function commitAddChild(sender: string, childName: string, parentName: string) {
    const senderNode = getNode(sender)

    if (!senderNode)
      return

    const srcEditor = useSchemaEditor(sender, senderNode.schema)
    srcEditor.addChild({ name: childName }, { name: parentName })
  }

  function commitDeleteNode(sender: string, name: string) {
    const senderNode = getNode(sender)

    if (!senderNode)
      return

    const srcEditor = useSchemaEditor(sender, senderNode.schema)
    srcEditor.deleteNode({ name })
  }

  return {
    commitAddRoot,
    commitAddChild,
    commitDeleteNode,
  }
}
