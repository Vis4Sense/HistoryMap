<script setup lang="ts">
import type { Concept } from '@/types/schema'
import { useExtractor } from '@/composables/useExtractor'
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import { SchemaType } from '@/types/extractor'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object as PropType<Concept>,
    required: true,
  },
})

const { data } = toRefs(props)

const {
  toggleConceptBookmark,
  toggleConceptIncluded,
} = useSchemaEditor()

const { openModal, setInput, enableClipping } = useExtractor()

function extendConcept() {
  openModal()
  setInput({
    schemaType: SchemaType.EgoNetwork,
    sourceText: '',
    centralConcept: data.value.name,
  })
  enableClipping()
}
</script>

<template>
  <div bg-white shadow border p-1 rounded flex>
    <BasicToolbarIcon
      :enable-tooltip="true"
      tooltip-content="Extend"
      @click="extendConcept"
    >
      <div i-carbon-add-alt />
    </BasicToolbarIcon>

    <BasicToolbarIcon
      :enable-tooltip="true"
      :tooltip-content="data.bookmarked ? 'Remove bookmark' : 'Bookmark'"
      @click="toggleConceptBookmark(id)"
    >
      <div v-if="data.bookmarked" i-carbon-bookmark-filled />
      <div v-else i-carbon-bookmark />
    </BasicToolbarIcon>

    <BasicToolbarIcon
      :enable-tooltip="true"
      :tooltip-content="data.included ? 'Remove from schema' : 'Include in schema'"
      @click="toggleConceptIncluded(id)"
    >
      <div v-if="data.included" i-carbon-checkbox-checked-filled />
      <div v-else i-carbon-checkbox-checked />
    </BasicToolbarIcon>
  </div>
</template>
