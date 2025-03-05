<script setup lang="ts">
import type { Concept, ElementProvenance, Schema } from '@/types/schema'
import type { PropType } from 'vue'
import _ from 'lodash'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  provenance: {
    type: Object as PropType<ElementProvenance[]>,
    default: null,
  },
})

const emit = defineEmits<{
  updateSchemaHeight: [height: number]
}>()

const { provenance } = toRefs(props)

const container = ref<HTMLElement>()

useResizeObserver(container, () => {
  nextTick(() => {
    // console.log(container.value.clientHeight)
    emit('updateSchemaHeight', container.value?.clientHeight || 0)
  })
})

// const changedConcepts = computed((): ElementProvenance<Concept>[] => {
//   if (!provenance.value)
//     return []
//   let provenance = _.cloneDeep(schema.value.provenance)
//   if (typeof provenance === 'object') {
//     provenance = Object.values(provenance)
//   }
//   provenance = provenance
//     .filter((p: ElementProvenance<any>) => p.targets.length)
//     .filter((p: ElementProvenance<any>) => p.elementType === 'concept')
//   return provenance
// })

onMounted(() => {
  console.log(provenance.value)
})
</script>

<template>
  <div
    ref="container"
    w-full
    text-sm p-1
    flex flex-wrap
    gap-1
  >
    <div
      v-for="concept, idx in provenance"
      :key="idx"
    >
      <div
        v-if="concept.changeType === 'add'"
        px-2 rounded
        bg-blue-1
      >
        {{ concept.diff.new?.name }}
      </div>
      <div
        v-else-if="concept.changeType === 'delete'"
        px-2 rounded
        bg-red-1
        line-through
      >
        {{ concept.diff.old?.name }}
      </div>
    </div>
  </div>
</template>
