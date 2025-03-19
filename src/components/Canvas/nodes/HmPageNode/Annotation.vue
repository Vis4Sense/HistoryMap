<script setup lang="ts">
import type { Annotation } from '@/types/historymap'
import type { Schema } from '@/types/schema.d'
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

const draggable = ref(false)

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
    :draggable="draggable"
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
    <!-- <div v-if="annotation.tags && annotation.tags.length" flex flex-nowrap px="1">
          <span v-for="tag in annotation.tags" px-1 bg-gray-1 rounded-lg>{{ tag }}</span>
        </div> -->
  </div>
</template>
