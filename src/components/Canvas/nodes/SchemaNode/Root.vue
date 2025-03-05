<script setup lang="ts">
import type { SchemaTreeNode } from '@/types/schema'
import type { PropType } from 'vue'
import Root from './Root.vue'

const props = defineProps({
  root: {
    type: Object as PropType<SchemaTreeNode>,
    required: true,
  },
})
</script>

<template>
  <div ml-4>
    <div
      w-full
      flex justify-between items-start
      relative
    >
      <div
        absolute left-0
        translate-x="-100%"
        text-gray-3
      >
        <div v-if="root.children && root.children.length" i-carbon-caret-down />
        <div v-else i-carbon-dot-mark text="0.6rem" mr-1 mt="1.5" />
      </div>

      <div rounded p="x-1" leading-tight>
        {{ root.name }}
      </div>
    </div>

    <div v-if="root.children">
      <Root
        v-for="child in root.children"
        :key="child.name"
        :root="child"
      />
    </div>
  </div>
</template>
