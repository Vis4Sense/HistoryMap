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

const { data, selected } = toRefs(props)

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
</script>

<template>
  <div
    w-full h-full
    border border-rounded
    p="x-2 y-1"
    hover:shadow
    :class="{
      'border-red': data!.isActive,
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
