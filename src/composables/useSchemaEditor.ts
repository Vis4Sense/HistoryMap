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
  }

  return module
}

export function useSchemaEditor(nodeId: string) {
  const { sourcePage } = useSchemaPanel()

  const { getNode, updateSchema, updateNode } = useSchemaMap()

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

  return {
    schemaEditor,
    addRoot,
    addChild,
    deleteNode,
  }
}
