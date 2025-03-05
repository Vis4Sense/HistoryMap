<script setup lang="ts">
import ToolRemoveSchema from '../node-tools/ToolRemoveSchema.vue'

defineProps({
  id: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div bg-white shadow border p-1 rounded flex>
    <ToolRemoveSchema :id="id" />
  </div>
</template>
