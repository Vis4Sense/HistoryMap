<script setup lang="ts">
import ToolRemove from './Toolbar/ToolRemove.vue'

defineProps({
  id: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div bg-white shadow border p-1 rounded>
    <ToolRemove :id="id" />
  </div>
</template>
