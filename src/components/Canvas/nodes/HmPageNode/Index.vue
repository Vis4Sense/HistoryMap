<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import HmPageNodeToolbar from '../../node-toolbars/HmPageNodeToolbar.vue'
import Header from './Header.vue'
import SchemaDiff from './SchemaDiff.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object as PropType<HmPage>,
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

const highlights = computed(() => {
  if (data.value.annotations) {
    return data.value.annotations.filter((anno) => anno.highlighted)
  }
  return null
})

useResizeObserver(highlightContainer, () => {
  nextTick(() => {
    if (highlightContainer.value) {
      emit('updateHeight', id.value, {
        'highlights': highlightContainer.value.clientHeight,
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
    }"
  >
    <Header
      class="nodrag nopan"
      text-sm h-5
      cursor-pointer
      hover:text-blue-8
      :data="data"
      @click="sendActivatePage()"
    />

    <SchemaDiff
      v-if="data.embeddedProvenance"
      :id="id"
      :provenance="data.embeddedProvenance ?? undefined"
      @update-schema-height="(h) => emit('updateHeight', id, { schemaDiff: h })"
    />

    <div
      ref="highlightContainer"
      v-if="highlights && highlights.length"
      p-1
    >
      <div v-for="highlight in highlights"
        :key="highlight.id"
        flex gap-1 text-sm
      >
        <div flex-auto truncate bg-yellow-1>
          {{ highlight.sourceText }}
        </div>
      </div>
    </div>

    <NodeToolbar
      :position="Position.Top"
      :is-visible="toolbarVisible"
    >
      <HmPageNodeToolbar :id="id" />
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
