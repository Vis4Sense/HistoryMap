<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import HmPageNodeToolbar from '../node-toolbars/HmPageNodeToolbar.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: Object as PropType<HmPage>,
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
    p="x-2 y-1"
    hover:shadow
    :class="{
      'border-red': data!.isActive,
      'border-2': selected,
    }"
  >
    <div flex gap-1 items-center text-sm>
      <!-- favicon -->
      <img
        v-if="data!.pageObj.favIconUrl"
        h-5
        :src="data!.pageObj.favIconUrl"
      >
      <div
        v-else
        i-carbon-earth-filled
        text-gray
      />

      <!-- title -->
      <span truncate>
        {{ data!.pageObj.title }}
      </span>
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
