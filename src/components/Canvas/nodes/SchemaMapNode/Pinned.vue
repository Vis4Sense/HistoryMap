<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { SchemaNode } from '@/types/schema'
import VueDraggableResizable from 'vue-draggable-resizable'
import Body from './Body.vue'
import Header from './Header.vue'
import { useSchemaMap } from '@/composables/useSchemaMap'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object as PropType<HmPage | SchemaNode>,
    required: true,
  },
})

const { id } = toRefs(props)

function onClose() {
  const { updateNode } = useSchemaMap()
  updateNode(id.value, { isPinned: false })
}
</script>

<template>
  <VueDraggableResizable
    absolute
    left="50%"
    top="25%"
    bg-white
    border border-gray-2
    drag-handle=".drag-handle"
    flex flex-col
    :w="200"
    :h="240"
  >
    <div
      shrink-0
      w-full p="x-2 y-1"
      bg-gray-1
      flex justify-between items-center
      class="drag-handle"
      cursor-move
    >
      <Header
        max-w="3/4"
        :id="id"
        :data="data"
      />
      <div shrink-0 text-sm flex items-center gap-1>
        <BasicToolbarIcon plain>
          <div i-mdi-cursor-move text-xs />
        </BasictoolbarIcon>
        <BasicToolbarIcon
          plain
          @click="onClose"
        >
          <div i-mdi-close />
        </BasictoolbarIcon>
      </div>
    </div>
    <div
      flex-auto flex flex-col overflow-auto
      bg-gray-1 bg-op-20
      p-2
    >
      <Body
        :id="id"
        :data="data"
      />
    </div>
  </VueDraggableResizable>
</template>
