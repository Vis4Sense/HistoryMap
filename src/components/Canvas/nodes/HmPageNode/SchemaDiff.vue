<script setup lang="ts">
import type { Concept, ElementProvenance, Schema } from '@/types/schema'
import type { PropType } from 'vue'
import _ from 'lodash'

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

const emit = defineEmits<{
  updateSchemaHeight: [height: number]
}>()

const { schema } = toRefs(props)

const container = ref<HTMLElement>()

useResizeObserver(container, () => {
  nextTick(() => {
    console.log(container.value.clientHeight)
    emit('updateSchemaHeight', container.value?.clientHeight || 0)
  })
})

const changedConcepts = computed((): ElementProvenance<Concept>[] => {
  if (!schema.value.provenance)
    return []
  let provenance = _.cloneDeep(schema.value.provenance)
  if (typeof provenance === 'object') {
    provenance = Object.values(provenance)
  }
  provenance = provenance
    .filter((p: ElementProvenance<any>) => p.targets.length)
    .filter((p: ElementProvenance<any>) => p.elementType === 'concept')
  return provenance
})
</script>

<template>
  <div ref="container"
    w-full
    text-sm p-1
    flex flex-wrap
    gap-1
  >
    <div
      v-for="concept, idx in changedConcepts"
      :key="idx"
    >
      <div v-if="concept.changeType === 'add'"
        px-2 rounded
        bg-blue-1
      >
        {{ concept.diff.new?.name }}
      </div>
    </div>
  </div>
</template>
