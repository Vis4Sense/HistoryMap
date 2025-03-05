import type { Concept, ElementProvenance, Schema, SchemaNode, SchemaTreeNode } from '@/types/schema.d'
import { useSchemaMap } from '@/composables/useSchemaMap'
import { newSchema } from '@/types/schema.d'
import _ from 'lodash'
import { useSchemaPanel } from './useSchemaPanel'

function SchemaEditor(schema_: Schema | undefined) {
  const schema = schema_ || newSchema()

  let sourcePage: string | null = null
  let provenance: ElementProvenance

  const nodeDict: Record<string, SchemaTreeNode> = {}

  /** utilities */

  function updateProvenance(change: Omit<ElementProvenance, 'time' | 'sourcePage'>) {
    provenance = {
      ...change,
      time: Date.now(),
    }
    if (sourcePage) {
      provenance.sourcePage = sourcePage
    }

    schema.provenance = _.concat(schema.provenance ?? [], provenance)
    sourcePage = null
  }

  /** initialise */
  function initialise() {
    // initialise node dict
    function registerNode(node: SchemaTreeNode) {
      nodeDict[node.name] = node
      node.children?.forEach((d) => {
        registerNode(d)
      })
    }
    Array.from(schema.schemaTree.roots).forEach(d => registerNode(d))
  }
  initialise()

  const module = {
    schema: () => schema,
    sourcePage: (id: string | null) => {
      sourcePage = id
      return module
    },

    addRoot: (concept: Partial<Concept> & Pick<Concept, 'name'>) => {
      const newConcept = { ...concept, parentName: null }

      schema.schemaTree.roots.push({ name: concept.name })
      schema.concepts.push(newConcept)

      updateProvenance({
        elementType: 'concept',
        changeType: 'add',
        diff: { old: null, new: newConcept },
      })

      return module
    },

    addChild: (
      child: Partial<Concept> & Pick<Concept, 'name'>,
      parentName: string,
    ) => {
      const parentNode = nodeDict[parentName]

      if (!parentNode) {
        module.addRoot(child)
        return module
      }

      const newConcept = { ...child, parentName }

      parentNode.children = _.concat(parentNode.children ?? [], { name: child.name })
      schema.concepts.push(newConcept)

      updateProvenance({
        elementType: 'concept',
        changeType: 'add',
        diff: { old: null, new: newConcept },
      })

      return module
    },

    deleteNode: (node: Partial<Concept> & Pick<Concept, 'name'>) => {
      const oldConcept = schema.concepts.find(d => d.name === node.name)

      if (!oldConcept) {
        console.error('concept not found', node.name)
        return
      }

      const siblings = oldConcept.parentName
        ? (nodeDict[oldConcept.parentName].children || [])
        : schema.schemaTree.roots
      _.remove(siblings, d => d.name === node.name)

      _.remove(schema.concepts, d => d.name === node.name)
      _.remove(schema.relations, d => d.source === node.name || d.target === node.name)

      updateProvenance({
        elementType: 'concept',
        changeType: 'delete',
        diff: { old: oldConcept, new: null },
      })

      return module
    },

    // move node into another node
    moveNodeInto: (
      name: string,
      parentName: string,
    ) => {
      const node = nodeDict[name]
      const oldConcept = schema.concepts.find(d => d.name === name)
  
      if (!oldConcept) {
        console.error('concept not found', name)
        return
      }
  
      const newConcept = { ...oldConcept, parentName }
  
      const oldParent = oldConcept.parentName
        ? nodeDict[oldConcept.parentName]
        : null
      const newParent = parentName ? nodeDict[parentName] : null
  
      if (oldParent) {
        _.remove(oldParent.children ?? [], d => d.name === name)
      } else {
        _.remove(schema.schemaTree.roots, d => d.name === name)
      }
  
      if (newParent) {
        newParent.children = _.concat(newParent.children ?? [], node)
      } else {
        schema.schemaTree.roots.push(node)
      }
  
      // replace old concept with new concept
      const idx = schema.concepts.findIndex(d => d.name === node.name)
      schema.concepts.splice(idx, 1, newConcept)
  
      updateProvenance({
        elementType: 'concept',
        changeType: 'move',
        diff: { old: oldConcept, new: newConcept },
      })
  
      return module
    },

    moveNodeBeforeAfter(
      name: string,
      targetName: string,
      position: 'before' | 'after' = 'before',
    ) {
      if (name === targetName) {
        return
      }

      const node = nodeDict[name]
      const oldConcept = schema.concepts.find(d => d.name === name)
      const targetConcept = schema.concepts.find(d => d.name === targetName)
  
      if (!oldConcept || !targetConcept) {
        console.error('concept not found', name)
        return
      }
  
      const oldParent = oldConcept.parentName
        ? nodeDict[oldConcept.parentName]
        : null
      const targetParent = targetConcept.parentName
        ? nodeDict[targetConcept.parentName]
        : null

      const newConcept = { ...oldConcept, parentName: targetConcept.parentName }

      if (!oldParent) {
        _.remove(schema.schemaTree.roots, d => d.name === name)
      } else {
        _.remove(oldParent.children ?? [], d => d.name === name)
      }

      if (!targetParent) {
        let idx = schema.schemaTree.roots.findIndex(d => d.name === targetName)
        if (idx !== undefined && idx >= 0) {
          idx = position === 'after' ? idx + 1 : idx
          schema.schemaTree.roots.splice(idx, 0, node)
        }
      } else {
        let idx = targetParent.children?.findIndex(d => d.name === targetName)
        if (idx !== undefined && idx >= 0) {
          idx = position === 'after' ? idx + 1 : idx
          targetParent.children?.splice(idx, 0, node)
        }
      }

      // replace old concept with new concept
      const idx = schema.concepts.findIndex(d => d.name === node.name)
      schema.concepts.splice(idx, 1, newConcept)

      updateProvenance({
        elementType: 'concept',
        changeType: 'move',
        diff: { old: oldConcept, new: newConcept },
      })

      return module
    }
  }

  return module
}

export function useSchemaEditor(nodeId: string) {
  const { sourcePage } = useSchemaPanel()

  const { getNode, updateSchema, updateNode, addSchemaNode } = useSchemaMap()

  // const nodeId = ref(activeSchemaNode.value?.id)
  const node = computed(() => getNode(nodeId))
  const schema = ref(node.value?.schema)
  const schemaEditor = computed(() => SchemaEditor(schema.value))

  /** utilities */

  function getSourcePage(id: string | null = null) {
    const src = id ?? sourcePage.value?.id ?? null
    if (src && node.value && node.value.id.startsWith('sm-')) {
      const sNode = node.value as SchemaNode
      if (!sNode.sources.includes(src)) {
        const newSources = [...sNode.sources, src]
        updateNode(nodeId, { sources: newSources })
      }
    }
    return src
  }

  /** Editing actions */

  // add root
  function addRoot(
    concept: Partial<Concept> & Pick<Concept, 'name'>,
    sourcePageId: string | null = null,
  ) {
    const newSchema = schemaEditor.value
      .sourcePage(getSourcePage(sourcePageId))
      .addRoot(concept)
      .schema()
    updateSchema(nodeId, newSchema)
  }

  // add child
  function addChild(
    child: Partial<Concept> & Pick<Concept, 'name'>,
    parentName: string,
    sourcePageId: string | null = null,
  ) {
    const newSchema = schemaEditor.value
      .sourcePage(getSourcePage(sourcePageId))
      .addChild(child, parentName)
      .schema()
    updateSchema(nodeId, newSchema)
  }

  // delete node
  function deleteNode(
    node: Partial<Concept> & Pick<Concept, 'name'>,
    sourcePageId: string | null = null,
  ) {
    const newSchema = schemaEditor.value
      .sourcePage(getSourcePage(sourcePageId))
      .deleteNode(node)
      ?.schema() ?? null
    if (newSchema) {
      updateSchema(nodeId, newSchema)
    }
  }

  function moveNodeInto(
    name: string,
    parentName: string,
    sourcePageId: string | null = null,
  ) {
    if (name === parentName) {
      return
    }
    const newSchema = schemaEditor.value
      .sourcePage(getSourcePage(sourcePageId))
      .moveNodeInto(name, parentName)
      ?.schema() || null
    if (newSchema) {
      updateSchema(nodeId, newSchema)
    }
  }

  function moveNodeBefore(
    name: string,
    targetName: string,
    sourcePageId: string | null = null,
  ) {
    if (name === targetName) {
      return
    }
    const newSchema = schemaEditor.value
      .sourcePage(getSourcePage(sourcePageId))
      .moveNodeBeforeAfter(name, targetName, 'before')
      ?.schema() || null
    if (newSchema) {
      updateSchema(nodeId, newSchema)
    }
  }

  function moveNodeAfter(
    name: string,
    targetName: string,
    sourcePageId: string | null = null,
  ) {
    if (name === targetName) {
      return
    }
    const newSchema = schemaEditor.value
      .sourcePage(getSourcePage(sourcePageId))
      .moveNodeBeforeAfter(name, targetName, 'after')
      ?.schema() || null
    if (newSchema) {
      updateSchema(nodeId, newSchema)
    }
  }

  // create new schema
  function createSchemaNode() {
    const source = sourcePage.value?.id
    const sources = source ? [source] : []
    addSchemaNode(sources)
  }

  return {
    schemaEditor,
    addRoot,
    addChild,
    deleteNode,
    moveNodeInto,
    moveNodeBefore,
    moveNodeAfter,
    createSchemaNode,
  }
}
