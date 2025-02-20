export interface Concept {
  name: string
  extractedBy?: 'model' | 'user'
  included?: boolean
  bookmarked?: boolean
}

// export interface Excitation {
//   level?: number
//   index?: number
// }

export interface Relation {
  source: string
  target: string
  category: string
}

export interface Schema {
  nodes: Concept[]
  links: Relation[]
}
