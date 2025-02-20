<script setup lang="ts">
import { useSchemaEditor } from '@/composables/useSchemaEditor'

const { schema } = useSchemaEditor()

const bookmarkedConcepts = computed(() => schema.value?.nodes
  .filter(node => node.bookmarked) || [])
</script>

<template>
  <div v-if="bookmarkedConcepts.length" bg-gray-2 bg-op-75 rounded p-2>
    <SchemaEditorConcept
      v-for="concept in bookmarkedConcepts"
      :key="concept.name"
      :name="concept.name"
      :selected="false"
      :bookmarked="true"
      :included="concept.included ?? false"
    />
  </div>
</template>
