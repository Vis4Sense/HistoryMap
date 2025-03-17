<script setup lang="ts">
import type { Annotation } from '@/types/historymap'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  annotation: {
    type: Object as PropType<Annotation>,
    required: true,
  },
})

const toolbarVisible = ref(false)
const draggable = ref(false)
</script>

<template>
  <div
    border-0.5 rounded
    text-xs
    space-y="0.5"
    :draggable="draggable"
  >
    <div
      cursor-auto
      @mouseenter="toolbarVisible = true"
      @mouseleave="toolbarVisible = false"
    >
      <div v-if="!toolbarVisible" h-0.25 />
      <div v-else flex gap-1 text="0.6rem" p-1>
        <div
          bg-gray-1 rounded-full
          hover:bg-gray-3
          cursor-pointer
          @mouseenter="draggable = true"
          @mouseleave="draggable = false"
        >
          <div i-mdi-arrow-all />
        </div>
        <!-- <div
          bg-gray-1 rounded-full text-transparent
          hover:bg-green hover:text-black cursor-pointer
        >
          <div i-carbon-checkmark />
        </div> -->
      </div>
    </div>

    <div v-if="annotation.highlighted" flex-auto truncate bg-yellow-1>
      {{ annotation.sourceText }}
    </div>
    <VSchemaTree
      v-if="annotation.schema"
      :schema="annotation.schema"
    />
    <!-- <div v-if="annotation.tags && annotation.tags.length" flex flex-nowrap px="1">
          <span v-for="tag in annotation.tags" px-1 bg-gray-1 rounded-lg>{{ tag }}</span>
        </div> -->
  </div>
</template>
