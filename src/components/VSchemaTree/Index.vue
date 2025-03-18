<script setup lang="ts">
import type { Provenance, Schema } from '@/types/schema'
import _ from 'lodash'
import { Tree } from './tree'

const props = defineProps({
  schema: {
    type: Object as PropType<Schema>,
    required: true,
  },
})

const emit = defineEmits<{
  updateSchema: [schema: Schema]
}>()

const { schema } = toRefs(props)

const tree = ref(new Tree(schema.value.concepts))
watch(schema, (newVal) => {
  tree.value = new Tree(newVal.concepts)
}, { deep: true })

function onEdit(provenance: Provenance) {
  const newSchema = {
    ...schema.value,
    concepts: tree.value.toConcepts(),
    provenance: [...(schema.value.provenance ?? []), provenance],
  }
  emit('updateSchema', newSchema)
}
</script>

<template>
  <div
    space-y-1 flex flex-col p="x-2 y-1"
  >
    <VSchemaTreeNode
      :node="tree.root"
      @add-node="onEdit($event)"
      @remove-node="onEdit($event)"
    />
  </div>
</template>
