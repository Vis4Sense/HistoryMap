<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { Schema, SchemaNode } from '@/types/schema'
import { useSchemaMap } from '@/composables/useSchemaMap'
import { newSchema } from '@/types/schema.d'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import SchemaMapNodeToolbar from '../../node-toolbars/SchemaMapNodeToolbar.vue'
import HmPageNodeAnnotation from '../HmPageNode/Annotation.vue'
import HmPageNodeHeader from '../HmPageNode/Header.vue'
import SchemaNodeHeader from '../SchemaNode/Header.vue'

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
}>()

const { id, data, selected } = toRefs(props)

const highlightContainer = ref<HTMLElement>()

/** toolbar visibility */
const { getSelectedNodes } = useVueFlow()
const toolbarVisible = computed(() => {
  return selected.value && getSelectedNodes.value.length === 1
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

/** whether to show schema tree */
const showSchemaTree = computed(() => {
  if (data.value.type === 'hm-page') {
    if (data.value.schema && data.value.schema.schemaTree.roots.length) {
      return true
    }
    if (data.value.annotations) {
      const tags = data.value.annotations.map(a => a.tags ?? []).flat()
      if (tags.length) {
        return true
      }
    }
  }
  else if (data.value.type === 'schema') {
    return true
  }
  return false
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
      'border-1.5 border-historymap': selected,
    }"
  >
    <HmPageNodeHeader
      v-if="data.type === 'hm-page'"
      class="nodrag nopan"
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
      max-h-40 overflow-auto
      class="nowheel nodrag"
    >
      <HmPageNodeAnnotation
        v-for="annotation in data.annotations"
        :id="id"
        :key="annotation.id"
        :annotation="annotation"
      />
    </div>

    <SchemaTree
      v-if="showSchemaTree"
      :id="id"
      :schema="data.schema"
      :annotations="'annotations' in data ? data.annotations : undefined"
      class="nodrag"
      overflow-visible
      text-sm
      @update-schema-tree-height="(h) => emit('updateHeight', id, { schemaTree: h })"
    />

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
