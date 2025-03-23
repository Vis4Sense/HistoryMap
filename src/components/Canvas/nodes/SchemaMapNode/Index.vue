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
const highlighted = computed(() => {
  let hasHighlighted = false
  forEachConcept(data.value, (concept) => {
    if (concept.highlighted) {
      hasHighlighted = true
    }
  })
  return hasHighlighted
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
    border border-rounded
    p="x-2 y-1"
    bg-white
    hover:shadow
    :class="{
      'border-blue': data!.isActive,
      'border-2': selected,
      'border-historymap': highlighted || selected,
      'flex flex-col': data.height,
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
