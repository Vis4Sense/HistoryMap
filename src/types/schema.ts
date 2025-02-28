export interface Concept {
  name: string // unique identifier
  extractedBy?: 'model' | 'user'
  parentName?: string // name of the parent concept in the hierarchy
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
  nodes: Concept[]
  links: Relation[]
}

export interface SchemaNode {
  sessionId: number
  uuid: string // sm-uuid
  schema: Schema
  sources: string[]
  timeCreated: number
  timeUpdated: number
  isActive: boolean
}
