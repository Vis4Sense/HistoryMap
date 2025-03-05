export interface Concept {
  name: string // unique identifier
  parentName: string | null // parent in the schema tree
  extractedBy?: 'model' | 'user'
  // included?: boolean
  // bookmarked?: boolean
}

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
  provenance?: ElementProvenance[]
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

/** Provenance of concept & relation change */
export interface ElementProvenance<Element = Concept | Relation> {
  // sources: string[] // id of the source nodes
  // targets: string[] // id of the target nodes
  sourcePage?: string
  time: number // time of change
  elementType: 'concept' | 'relation'
  changeType: 'add' | 'delete' | 'update'
  diff: {
    old: Element | null
    new: Element | null
  }
}
