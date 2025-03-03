import type { Concept, Schema, SchemaTreeNode } from '@/types/schema'
import { useSchemaMap } from '@/composables/useSchemaMap'

export function useSchemaEditor(id_: string, schema_: Schema) {
  let id = id_
  let schema = schema_

  const nodeDict: Record<string, SchemaTreeNode> = {}

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
    updateSchema(id, schema)
  }

  /** initialise */
  function initialise() {
    // initialise node dict
    function registerNode(node: SchemaTreeNode) {
      nodeDict[node.name] = node
      if (node.children) {
        node.children.forEach(registerNode)
      }
    }
    Array.from(schema.schemaTree.roots).forEach(registerNode)
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
  }
}
