<script setup lang="ts">
import type { SchemaNode } from '@/types/schema.d'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import SchemaNodeToolbar from '../../node-toolbars/SchemaNodeToolbar.vue'
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
  selected: Boolean,
})

const emit = defineEmits<{
  updateHeight: [id: string, height: Record<string, number>]
}>()

const { id } = toRefs(props)

const { data, selected } = toRefs(props)

/** toolbar visibility */
const { getSelectedNodes } = useVueFlow()
const toolbarVisible = computed(() => {
  return selected.value && getSelectedNodes.value.length === 1
})

const container = ref<HTMLElement>()

useResizeObserver(container, () => {
  nextTick(() => {
    // console.log(container.value.clientHeight)
    emit('updateHeight', id.value, { schema: container.value?.clientHeight || 0 })
  })
})
</script>

<template>
  <div
    w-full h-full
    border border-rounded
    p="x-2 y-1"
    bg-white
    :class="{
      'border-amber-5': data!.isActive,
      'border-2 border-historymap': selected,
    }"
  >
    <Header :schema="data.schema" />

    <div ref="container" text-sm ml-2>
      <Root
        v-for="root in data.schema.schemaTree.roots"
        :key="root.name"
        :root="root"
      />
    </div>

    <NodeToolbar
      :position="Position.Top"
      :is-visible="toolbarVisible"
    >
      <SchemaNodeToolbar :id="id" />
    </NodeToolbar>

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
