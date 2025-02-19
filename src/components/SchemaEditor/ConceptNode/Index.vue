<script setup lang="ts">
import { Concept } from '@/types/schema'
import type { Node } from '@vue-flow/core'
import { Position, useVueFlow } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: Object as PropType<Concept>,
  selected: Boolean,
})

const { data, selected } = toRefs(props)

/** toolbar visibility */
const { getSelectedNodes } = useVueFlow()
const toolbarVisible = computed(() => {
  return selected.value && getSelectedNodes.value.length === 1
})
</script>

<template>
  <div
    w-full h-full
    border border-rounded
    bg-white
    p="x-2 y-1"
    hover:shadow
    :class="{
      'border-2': selected,
      'border-dashed text-gray-4': !data?.included,
    }"
  >
    <div flex gap-1 items-center text-xs>
      {{ data?.name }}
    </div>

    <NodeToolbar
      :position="Position.Top"
      :is-visible="toolbarVisible"
    >
      <SchemaEditorConceptNodeToolbar :id="id" />
    </NodeToolbar>
  </div>
</template>
