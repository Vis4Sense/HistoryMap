// This file is based on vue-tree-list
// Source: https://github.com/ParadeTo/vue-tree-list/blob/master/src/Tree.js
// Modified with additional changes

import type { Concept } from '@/types/schema'

interface TreeConcept extends Concept {
  included?: boolean
}

export class TreeNode {
  name: string
  parentName: string | null
  description?: string | null
  parent?: TreeNode | null
  children?: TreeNode[]
  virtual?: boolean
  included?: boolean

  constructor(data: TreeConcept, isVirtual = false) {
    this.name = data.name
    this.parentName = data.parentName
    this.description = data.description ?? null
    this.included = data.included ?? false
    if (isVirtual) {
      this.virtual = true
    }
  }

  rename(name: string) {
    this.name = name
    this.children?.forEach((child) => {
      child.parentName = name
    })
  }

  addChild(child: TreeNode) {
    if (!this.children) {
      this.children = []
    }
    this.children.push(child)
    child.parent = this
    child.parentName = this.virtual ? null : this.name
    return child
  }

  insertBefore(node: TreeNode) {
    if (this.parent) {
      const index = this.parent.children!.indexOf(this)
      this.parent.children!.splice(index, 0, node)
      node.parent = this.parent
      node.parentName = this.parent.name
    }
  }

  insertAfter(node: TreeNode) {
    if (this.parent) {
      const index = this.parent.children!.indexOf(this)
      this.parent.children!.splice(index + 1, 0, node)
      node.parent = this.parent
      node.parentName = this.parent.name
    }
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
      this.children.forEach((child) => {
        concepts.push(...child.toConcepts())
      })
    }
    return concepts
  }
}

export class Tree {
  root: TreeNode
  nodeDict: Record<string, TreeNode>

  constructor(data: Concept[]) {
    this.nodeDict = {}
    this.root = new TreeNode({
      name: '',
      parentName: null,
    }, true)

    data.forEach((d) => {
      this.nodeDict[d.name] = new TreeNode(d)
    })

    data.forEach((d) => {
      let parent = null
      if (d.parentName) {
        parent = this.nodeDict[d.parentName]
      }

      if (parent) {
        parent.addChild(this.nodeDict[d.name])
      }
      else {
        this.root.addChild(this.nodeDict[d.name])
      }
    })
  }

  toConcepts(): Concept[] {
    return this.root.toConcepts()
  }

  removeConcept(name: string) {
    const node = this.nodeDict[name]
    if (node) {
      node.remove()
    }
  }
}
