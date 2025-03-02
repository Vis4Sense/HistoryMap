<script setup lang="ts">
import ToolRemove from '../node-tools/ToolRemove.vue'
// import ToolSchematise from '../node-tools/ToolSchematise.vue'

defineProps({
  id: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div bg-white shadow border p-1 rounded flex>
    <!-- <ToolSchematise :id="id" /> -->
    <ToolRemove :id="id" />
  </div>
</template>
