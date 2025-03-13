<script setup lang="ts">
import { useSchemaMap } from '@/composables/useSchemaMap'

defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { addSchemaNode } = useSchemaMap()
</script>

<template>
  <BasicToolbarIcon @click="addSchemaNode([id])">
    <div i-mdi-puzzle-plus-outline></div>
  </BasicToolbarIcon>
</template>
