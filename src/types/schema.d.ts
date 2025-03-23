export interface Concept {
  name: string // unique identifier
  parentName: string | null // parent in the schema tree
  extractedBy?: 'model' | 'user'
  description?: string
  included?: boolean
  unincluded?: boolean
  highlighted?: boolean
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
  title?: string
  lod?: 'concept' | 'summary' | 'detail'
  // schemaTree: SchemaTree
  concepts: Concept[]
  // relations: Relation[]
  provenance?: Provenance[]
}

export function newSchema(): Schema {
  return {
    concepts: [],
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
  width?: number
  height?: number
  isMinimised?: boolean
  isPinned?: boolean
}

/** Provenance of concept & relation change */
// export interface ElementProvenance<Element = Concept | Relation> {
//   // sources: string[] // id of the source nodes
//   // targets: string[] // id of the target nodes
//   sourcePage?: string
//   time: number // time of change
//   elementType: 'concept' | 'relation'
//   changeType: 'add' | 'delete' | 'update' | 'move'
//   diff: {
//     old: Element | null
//     new: Element | null
//   }
// }
export interface Provenance {
  sourcePage?: string
  time: number // time of change
  changeType: 'add' | 'delete' | 'move' | 'rename' | 'update'
  diff: {
    old: Concept | Concept[] | null
    new: Concept | Concept[] | null
  }
}
