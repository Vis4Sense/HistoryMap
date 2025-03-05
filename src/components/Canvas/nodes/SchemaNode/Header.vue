<script setup lang="ts">
import { Schema } from '@/types/schema.d'

defineProps({
  schema: {
    type: Object as PropType<Schema>,
    required: true,
  },
})
</script>

<template>
  <div flex gap-1 items-center>
    <div i-mdi-puzzle text-amber-5 />
    <div>{{ schema?.title ?? 'Schema' }}</div>
  </div>
</template>
