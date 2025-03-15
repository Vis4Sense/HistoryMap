<script setup lang="ts">
import type { SchemaTreeNode } from '@/types/schema'
import Node from './Node.vue'

export interface TreeNode extends SchemaTreeNode {
  description?: string
}

const props = defineProps({
  node: {
    type: Object as PropType<TreeNode>,
    required: true,
  },
  virtualRoot: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div :ml="virtualRoot ? 0 : 2">
    <div
      v-if="!virtualRoot"
      w-full
      flex justify-between items-start
      relative
      cursor-pointer
      draggable="true"
      py="0.5"
    >
      <div
        absolute left-0 translate-x="-100%"
        text-gray-3
      >
        <div v-if="node.children && node.children.length" i-carbon-caret-down />
        <div v-else i-carbon-dot-mark text="0.5rem" mt="0.5" />
      </div>

      <div leading-tight text-ellipsis line-clamp-2>
        <span rounded-lg p="x-1" bg-gray-1 mr-1 font-medium>{{ node.name }} </span>
        <span v-if="node.description" text-gray-5>{{ node.description }}</span>
      </div>

      <!-- <div
          v-if="showToolbar"
          flex
          absolute right-1
          px-1
          bg-white bg-op-90
        >
          <BasicToolbarIcon plain @click="startEditing">
            <div i-carbon-add />
          </BasicToolbarIcon>
          <BasicToolbarIcon plain @click="emit('deleteNode', node.name)">
            <div i-carbon-delete />
          </BasicToolbarIcon>
        </div> -->
    </div>

    <div v-if="node.children">
      <Node
        v-for="child, idx in node.children"
        :key="child.name"
        :node="child"
      />
    </div>
  </div>
</template>
