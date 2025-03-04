import type { Concept, ElementProvenance, Schema, SchemaTreeNode } from '@/types/schema.d'
import { useSchemaMap } from '@/composables/useSchemaMap'
import { newSchema } from '@/types/schema.d'
import _ from 'lodash'

export function useSchemaEditor(id_: string, schema_: Schema | undefined) {
  let id = id_
  let schema = schema_ || newSchema()

  const nodeDict: Record<string, SchemaTreeNode> = {}
  const nodeParentDict: Record<string, string | null> = {}

  const { updateSchema } = useSchemaMap()

  /** Editing actions */

  // add root
  function addRoot(
    concept: Partial<Concept> & Pick<Concept, 'name'>,
    provenance: ElementProvenance<Concept>[],
  ) {
    const newConcept = { ...concept, parentName: null }
    schema.schemaTree.roots.push({ name: concept.name })
    schema.concepts.push(newConcept)
    provenance.forEach((d) => {
      d.diff.new = newConcept
    })
    if (!schema.provenance) {
      schema.provenance = []
    }
    schema.provenance= _.concat(schema.provenance, provenance)
    updateSchema(id, schema)
  }

  // add child
  function addChild(
    child: Partial<Concept> & Pick<Concept, 'name'>,
    parent: Partial<Concept> & Pick<Concept, 'name'>,
  ) {
    const parentNode = nodeDict[parent.name]
    if (!parentNode) {
      console.error('parent not found', parent.name)
      return
    }
    if (!parentNode.children) {
      parentNode.children = []
    }
    parentNode.children.push({ name: child.name })

    schema.concepts.push({
      ...child,
      parentName: parent.name,
    })
    schema.relations.push({
      source: parent.name,
      target: child.name,
      category: 'has child',
    })

    updateSchema(id, schema)
  }

  // delete node
  function deleteNode(node: Partial<Concept> & Pick<Concept, 'name'>) {
    const parentName = nodeParentDict[node.name]
    const siblings = parentName
      ? (nodeDict[parentName].children || [])
      : schema.schemaTree.roots
    _.remove(siblings, d => d.name === node.name)

    // TODO: update concepts and relations

    updateSchema(id, schema)
  }

  /** initialise */
  function initialise() {
    // initialise node dict
    function registerNode(node: SchemaTreeNode, parent: SchemaTreeNode | null = null) {
      nodeDict[node.name] = node
      nodeParentDict[node.name] = parent?.name || null
      if (node.children) {
        node.children.forEach((d) => {
          registerNode(d, node)
        })
      }
    }
    Array.from(schema.schemaTree.roots).forEach(d => registerNode(d))
  }
  initialise()

  return {
    // update id
    id(id_: string) {
      id = id_
      return this
    },
    // update schema
    schema(schema_: Schema) {
      schema = schema_
      initialise()
      return this
    },
    addRoot,
    addChild,
    deleteNode,
  }
}
