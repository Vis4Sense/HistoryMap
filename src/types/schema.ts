export interface Concept {
  name: string
  extractedBy?: 'model' | 'user'
  included?: boolean
  excitation?: Excitation
}

export interface Excitation {
  level: number
  index?: number
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
