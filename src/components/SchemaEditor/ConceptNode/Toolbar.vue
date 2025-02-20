<script setup lang="ts">
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import { Concept } from '@/types/schema'

defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object as PropType<Concept>,
    required: true,
  },
})

const { toggleConceptBookmark } = useSchemaEditor()
</script>

<template>
  <div bg-white shadow border p-1 rounded flex>
    <BasicToolbarIcon @click="toggleConceptBookmark(id)">
      <div v-if="data.bookmarked" i-carbon-bookmark-filled></div>
      <div v-else i-carbon-bookmark></div>
    </BasicToolbarIcon>
  </div>
</template>
