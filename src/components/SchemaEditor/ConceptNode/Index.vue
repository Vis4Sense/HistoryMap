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
  data: {
    type: Object as PropType<Concept>,
    required: true,
  },
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
  <div>
    <SchemaEditorConcept
      :name="data.name"
      :selected="selected"
      :bookmarked="data.bookmarked ?? false"
      :included="data.included ?? false"
    />

    <NodeToolbar
      :position="Position.Right"
      :is-visible="toolbarVisible"
    >
      <SchemaEditorConceptNodeToolbar
        :id="id" :data="data"
      />
    </NodeToolbar>
  </div>
</template>
