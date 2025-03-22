<script setup lang="ts">
import { useSchemaMap } from '@/composables/useSchemaMap'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { id } = toRefs(props)

function onExpand() {
  const { updateNode } = useSchemaMap()
  updateNode(id.value, { isMinimised: false })
}
</script>

<template>
  <div
    w-full h-full
  >
    <div
      w-full h-full
      bg-gray-3 border border-gray rounded-full
      hover:bg-gray
      cursor-pointer
      @click="onExpand"
    />

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
