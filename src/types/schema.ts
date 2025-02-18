export interface Concept {
  name: string
}

export interface Relation {
  source: string
  target: string
  category: string
}

export interface Schema {
  nodes: Concept[]
  links: Relation[]
}
