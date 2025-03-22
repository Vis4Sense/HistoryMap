<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { Schema, SchemaNode } from '@/types/schema'
import { forEachConcept, useSchemaMap } from '@/composables/useSchemaMap'
import { newSchema } from '@/types/schema.d'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import SchemaMapNodeToolbar from '../../node-toolbars/SchemaMapNodeToolbar.vue'
import HmPageNodeAnnotation from '../HmPageNode/Annotation.vue'
import HmPageNodeHeader from '../HmPageNode/Header.vue'
import SchemaNodeHeader from '../SchemaNode/Header.vue'
import SchemaNodeTree from '../SchemaNode/Tree.vue'

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

const highlightContainer = ref<HTMLElement>()
const schemaContainer = ref<HTMLElement>()

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

/** send message to controller to open clicked page */
function sendActivatePage() {
  chrome.runtime.sendMessage({
    type: 'activate-page',
    data: data.value,
  })
}

useResizeObserver(highlightContainer, () => {
  nextTick(() => {
    if (highlightContainer.value) {
      emit('updateHeight', id.value, {
        highlights: highlightContainer.value.clientHeight,
      })
    }
  })
})
useResizeObserver(schemaContainer, () => {
  nextTick(() => {
    if (schemaContainer.value) {
      emit('updateHeight', id.value, {
        schemaTree: schemaContainer.value.clientHeight,
      })
    }
  })
})

/** handle title update */
function onTitleUpdate(title: string) {
  const { updateNode } = useSchemaMap()
  let schema: Schema
  if (data.value.schema) {
    schema = { ...data.value.schema, title }
  }
  else {
    schema = { ...newSchema(), title }
  }
  updateNode(data.value.id, { schema })
}
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

    <HmPageNodeHeader
      v-if="data.type === 'hm-page'"
      class="nodrag nopan"
      shrink-0
      text-sm h-5
      cursor-pointer
      hover:text-blue-8
      :data="data"
      @click="sendActivatePage()"
    />
    <SchemaNodeHeader
      v-else
      :schema="data.schema"
      @update-title="onTitleUpdate"
    />

    <div
      v-if="data.type === 'hm-page'
        && data.annotations
      "
      ref="highlightContainer"
      p-1
      space-y-1
      overflow-auto
      :class="{
        'max-h-40': !data.height,
        'flex-auto': data.height,
      }"
      class="nowheel nodrag"
    >
      <HmPageNodeAnnotation
        v-for="annotation in data.annotations"
        :id="id"
        :key="annotation.id"
        :annotation="annotation"
      />
    </div>

    <div
      v-if="data.type === 'schema'"
      ref="schemaContainer"
      overflow-auto
      text-xs
      class="nowheel nodrag"
      :class="{
        'max-h-40': !data.height,
        'flex-auto': data.height,
      }"
      @click="e => e.stopPropagation()"
    >
      <SchemaNodeTree
        :id="id"
        :schema="data.schema"
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
