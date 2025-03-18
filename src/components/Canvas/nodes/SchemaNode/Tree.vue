<script setup lang="ts">
import { Schema } from '@/types/schema.d'
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
})

const { id } = toRefs(props)

function onUpdateSchema(newSchema: Schema) {
  const { updateSchema } = useSchemaMap()
  updateSchema(id.value, newSchema)
}
</script>

<template>
  <VSchemaTree
    :id="id"
    :schema="schema"
    @update-schema="onUpdateSchema"
  />
</template>
