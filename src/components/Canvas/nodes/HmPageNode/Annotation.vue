<script setup lang="ts">
import type { Annotation } from '@/types/historymap'
import type { Schema } from '@/types/schema.d'
import { useDragAndDropTree } from '@/composables/useDnDTree'
import { useHistoryMap } from '@/composables/useHistoryMap'

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

const { id, annotation } = toRefs(props)

const { onDragStart, onDragEnd } = useDragAndDropTree()

function onUpdateSchema(schema: Schema) {
  const { updateAnnotation } = useHistoryMap()
  updateAnnotation(id.value, annotation.value.id, { schema })
}
</script>

<template>
  <div
    relative
    border-0.5 rounded
    text-xs
    space-y="0.5"
    @click="e => e.stopPropagation()"
  >
    <div v-if="annotation.highlighted" flex-auto truncate bg-yellow-1>
      {{ annotation.sourceText }}
    </div>
    <VSchemaTree
      v-if="annotation.schema"
      :id="id"
      :schema="annotation.schema"
      @update-schema="onUpdateSchema"
    />
    <div v-if="annotation.tags && annotation.tags.length" flex flex-nowrap p-1>
      <span
        v-for="tag in annotation.tags"
        :key="tag"
        px-1 bg-gray-1 rounded-lg
        hover:bg-gray-2
        draggable="true"
        cursor-pointer
        @dragstart="onDragStart(id, [{ name: tag, parentName: null }])"
        @dragend="onDragEnd"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>
