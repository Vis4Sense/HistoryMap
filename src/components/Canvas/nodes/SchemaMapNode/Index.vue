<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { SchemaNode } from '@/types/schema'
import { forEachConcept } from '@/composables/useSchemaMap'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import SchemaMapNodeToolbar from '../../node-toolbars/SchemaMapNodeToolbar.vue'
import Body from './Body.vue'
import Header from './Header.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object as PropType<HmPage | SchemaNode>,
    required: true,
  },
  selected: Boolean,
})

const emit = defineEmits<{
  updateHeight: [id: string, height: Record<string, number>]
  resize: [width: number, height: number]
}>()

const { id, data, selected } = toRefs(props)

const bodyContainer = ref<HTMLElement>()

/** toolbar visibility */
const { getSelectedNodes } = useVueFlow()
const toolbarVisible = computed(() => {
  return selected.value && getSelectedNodes.value.length === 1
})

/** highlight node if it has highlighted concepts */
const hasHighlighted = computed(() => {
  let hasHighlighted = false
  forEachConcept(data.value, (concept) => {
    if (concept.highlighted) {
      hasHighlighted = true
    }
  })
  return hasHighlighted
})
const hasSelected = computed(() => {
  let hasSelected = false
  forEachConcept(data.value, (concept) => {
    if (concept.selected) {
      hasSelected = true
    }
  })
  return hasSelected
})

useResizeObserver(bodyContainer, () => {
  nextTick(() => {
    if (bodyContainer.value && bodyContainer.value.clientHeight) {
      emit('updateHeight', id.value, {
        body: bodyContainer.value.clientHeight,
      })
    }
  })
})
</script>

<template>
  <div
    w-full h-full
    p="x-2 y-1"
    bg-white
    hover:shadow
    class="border border-rounded"
    :class="{
      'border-blue': data!.isActive && data.type === 'hm-page',
      'border-2': selected,
      'border-historymap': (hasHighlighted || selected || hasSelected) && !(data!.isActive && data.type === 'hm-page'),
      'flex flex-col': data.height,
      'border-dashed': hasHighlighted && !selected && !hasSelected && !(data!.isActive && data.type === 'hm-page'),
      'border-gray-600': data.type === 'schema',
      'border-gray-400': data.type === 'hm-page' && !data.isActive,
    }"
  >
    <NodeResizer
      v-if="selected"
      @resize-end="(e) => emit('resize', e.params.width, e.params.height)"
    />

    <Header
      :id="id"
      :data="data"
    />
    <div
      ref="bodyContainer"
      :class="{
        'max-h-40': !data.height,
        'flex-auto': data.height,
      }"
      overflow-auto
      class="nowheel nodrag"
    >
      <Body
        :id="id"
        :data="data"
      />
    </div>

    <NodeToolbar
      :position="Position.Top"
      :is-visible="toolbarVisible"
    >
      <SchemaMapNodeToolbar :id="id" :type="data.type" />
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
