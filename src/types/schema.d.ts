export interface Concept {
  name: string // unique identifier
  extractedBy?: 'model' | 'user'
  // included?: boolean
  // bookmarked?: boolean
}

// export interface Excitation {
//   level?: number
//   index?: number
// }

/** hierarchical structure of the schema */
export interface SchemaTreeNode {
  name: string // name of the concept
  children?: SchemaTreeNode[]
}
export interface SchemaTree {
  roots: SchemaTreeNode[]
}

export interface Relation {
  source: string
  target: string
  category: string
}

export interface Schema {
  schemaTree: SchemaTree
  concepts: Concept[]
  relations: Relation[]
}

export function newSchema(): Schema {
  return {
    schemaTree: {
      roots: [],
    },
    concepts: [],
    relations: [],
  }
}

export interface SchemaNode {
  sessionId: number
  id: string // sm-uuid
  type: 'schema'
  schema: Schema
  sources: string[]
  timeCreated: number
  timeUpdated: number
  isActive: boolean
}
