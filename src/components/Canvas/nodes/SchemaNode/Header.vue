<script setup lang="ts">
import type { Schema } from '@/types/schema.d'

const props = defineProps({
  schema: {
    type: Object as PropType<Schema>,
    required: true,
  },
})

const emit = defineEmits<{
  updateTitle: [title: string]
}>()

const { schema } = toRefs(props)
const schemaTitle = ref(null as HTMLDivElement | null)

function updateSchemaTitle() {
  if (schemaTitle.value) {
    const title = schemaTitle.value.textContent?.trim() || ''
    if (title) {
      emit('updateTitle', title)
    }
  }
}
</script>

<template>
  <div flex gap-1 items-center>
    <div i-mdi-puzzle text-amber-5 />
    <div
      ref="schemaTitle"
      contenteditable
      cursor-auto
      class="nodrag"
      @blur="updateSchemaTitle"
      @keydown.enter.prevent="(e) => e.target.blur()"
    >
      {{ schema?.title ?? 'Schema' }}
    </div>
  </div>
</template>
