// This file is based on vue-tree-list
// Source: https://github.com/ParadeTo/vue-tree-list/blob/master/src/Tree.js
// Modified with additional changes

import { Concept } from "@/types/schema"

export class TreeNode {
  name: string
  parentName: string | null
  description?: string | null
  parent?: TreeNode | null
  children?: TreeNode[]
  virtual?: boolean

  constructor(data: Concept, isVirtual = false) {
    this.name = data.name
    this.parentName = data.parentName
    this.description = data.description ?? null
    if (isVirtual) {
      this.virtual = true
    }
  }

  addChild(child: TreeNode) {
    if (!this.children) {
      this.children = []
    }
    this.children.push(child)
    child.parent = this
    return child
  }

  remove() {
    if (this.parent) {
      const index = this.parent.children!.indexOf(this)
      this.parent.children!.splice(index, 1)
    }
  }

  toConcept(): Concept {
    const concept: Concept = {
      name: this.name,
      parentName: this.parentName,
    }
    if (this.description) {
      concept.description = this.description
    }
    return concept
  }

  toConcepts(): Concept[] {
    const concepts: Concept[] = []
    if (!this.virtual) {
      concepts.push(this.toConcept())
    }
    if (this.children) {
      this.children.forEach(child => {
        concepts.push(...child.toConcepts())
      })
    }
    return concepts
  }
}

export class Tree {
  root: TreeNode

  constructor(data: Concept[]) {
    this.root = new TreeNode({
      name: 'root',
      parentName: null,
    }, true)

    const map: Record<string, TreeNode> = {}
    data.forEach(d => {
      map[d.name] = new TreeNode(d)
    })

    data.forEach(d => {
      if (d.parentName) {
        const parent = map[d.parentName]
        parent.addChild(map[d.name])
      }
      else {
        this.root.addChild(map[d.name])
      }
    })
  }

  toConcepts(): Concept[] {
    return this.root.toConcepts()
  }
}
