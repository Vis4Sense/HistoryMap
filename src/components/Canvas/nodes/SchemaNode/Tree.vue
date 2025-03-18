<script setup lang="ts">
import type { Schema } from '@/types/schema.d'
import { useSchemaMap } from '@/composables/useSchemaMap'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  schema: {
    type: Object as PropType<Schema>,
    required: true,
  },
  targetConcepts: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
})

const { id } = toRefs(props)

function onUpdateSchema(newSchema: Schema) {
  const { updateSchema } = useSchemaMap()
  updateSchema(id.value, newSchema)
}

function addSource(sourceId: string) {
  const { addSourceToNode } = useSchemaMap()
  addSourceToNode(id.value, sourceId)
}
</script>

<template>
  <VSchemaTree
    :id="id"
    :schema="schema"
    :target-concepts="targetConcepts"
    @update-schema="onUpdateSchema"
    @add-source="addSource"
  />
</template>
