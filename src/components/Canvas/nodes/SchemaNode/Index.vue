<script setup lang="ts">
import type { SchemaNode } from '@/types/schema.d'
import { Handle, Position } from '@vue-flow/core'
import Header from './Header.vue'
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

const { id } = toRefs(props)

const emit = defineEmits<{
  updateHeight: [id: string, height: Record<string, number>]
}>()

const container = ref<HTMLElement>()

useResizeObserver(container, () => {
  nextTick(() => {
    // console.log(container.value.clientHeight)
    emit('updateHeight', id.value, { 'schema': container.value?.clientHeight || 0 })
  })
})
</script>

<template>
  <div
    w-full h-full
    border border-rounded
    p="x-2 y-1"
    bg-white
  >
    <Header :schema="data.schema" />

    <div text-sm ml-2 ref="container">
      <Root
        v-for="root in data.schema.schemaTree.roots"
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
