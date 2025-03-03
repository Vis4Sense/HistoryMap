import type { Concept, Schema, SchemaTreeNode } from '@/types/schema'
import { useSchemaMap } from '@/composables/useSchemaMap'
import _ from 'lodash'

export function useSchemaEditor(id_: string, schema_: Schema) {
  let id = id_
  let schema = schema_

  const nodeDict: Record<string, SchemaTreeNode> = {}
  const nodeParentDict: Record<string, string | null> = {}

  const { updateSchema } = useSchemaMap()

  /** Editing actions */

  // add root
  function addRoot(concept: Partial<Concept> & Pick<Concept, 'name'>) {
    schema.schemaTree.roots.push({ name: concept.name })
    schema.concepts.push(concept)
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

    schema.concepts.push(child)
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
