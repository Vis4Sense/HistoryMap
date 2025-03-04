<script setup lang="ts">
import {  SchemaNode } from '@/types/schema.d'
import { Handle, Position } from '@vue-flow/core'
import Root from './Root.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object as PropType<SchemaNode>,
    required: true,
  },
})
</script>

<template>
  <div
    border border-rounded
    p="x-2 y-1"
  >
    <div>schema node</div>

    <div text-sm ml-2>
      <Root v-for="root in data.schema.schemaTree.roots"
        :key="root.name"
        :root="root"
      />
    </div>

    <Handle
      type="source"
      :position="Position.Right"
    />
    <Handle
      type="target"
      :position="Position.Left"
    />
  </div>
</template>
