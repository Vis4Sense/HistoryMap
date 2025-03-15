<script setup lang="ts">
import type { Schema } from '@/types/schema'
import type { TreeNode } from './Node'
import _ from 'lodash'

const props = defineProps({
  schema: {
    type: Object as PropType<Schema>,
    required: true,
  },
})

const { schema } = toRefs(props)

const virtualRoot = computed(() => {
  const root = {
    name: '',
    children: _.cloneDeep(schema.value.schemaTree.roots) as TreeNode[],
  }
  function addDescription(node: TreeNode): TreeNode {
    if (node.children) {
      node.children.forEach((child) => {
        addDescription(child)
      })
    }
    node.description = schema.value.concepts.find(concept => concept.name === node.name)?.description
  }
  addDescription(root)
  return root
})
</script>

<template>
  <div
    space-y-1 flex flex-col p="x-2 y-1"
  >
    <VSchemaTreeNode
      :node="virtualRoot"
      :virtual-root="true"
    />
  </div>
</template>
