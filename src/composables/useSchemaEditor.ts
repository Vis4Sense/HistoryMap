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

    // update schema
    schema.schemaTree.roots.push({ name: concept.name })
    schema.concepts.push(newConcept)

    // update provenance
    provenance.forEach((d) => {
      d.diff.new = newConcept
    })
    schema.provenance= _.concat(schema.provenance ?? [], provenance)

    updateSchema(id, schema)
  }

  // add child
  function addChild(
    child: Partial<Concept> & Pick<Concept, 'name'>,
    parent: Partial<Concept> & Pick<Concept, 'name'>,
    provenance: ElementProvenance<Concept>[],
  ) {
    const parentNode = nodeDict[parent.name]
    if (!parentNode) {
      console.error('parent not found', parent.name)
      return
    }

    const newConcept = { ...child, parentName: parent.name }

    // update schema
    parentNode.children = _.concat(parentNode.children ?? [], { name: child.name })
    schema.concepts.push(newConcept)

    // update provenance
    provenance.forEach((d) => {
      d.diff.new = newConcept
    })
    schema.provenance = _.concat(schema.provenance ?? [], provenance)

    updateSchema(id, schema)
  }

  // delete node
  function deleteNode(
    node: Partial<Concept> & Pick<Concept, 'name'>,
    provenance: ElementProvenance<Concept>[],
  ) {
    const oldConcept = schema.concepts.find(d => d.name === node.name)
      ?? { name: node.name, parentName: null }

    const siblings = oldConcept.parentName
      ? (nodeDict[oldConcept.parentName].children || [])
      : schema.schemaTree.roots
    _.remove(siblings, d => d.name === node.name)

    _.remove(schema.concepts, d => d.name === node.name)
    _.remove(schema.relations, d => d.source === node.name || d.target === node.name)

    // update provenance
    provenance.forEach((d) => {
      d.diff.old = oldConcept
    })
    schema.provenance = _.concat(schema.provenance ?? [], provenance)

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
