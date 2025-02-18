<script setup lang="ts">
import ToolIcon from './ToolIcon.vue'

const emit = defineEmits(['extract'])
</script>

<template>
  <div bg-white bg-op-80 shadow text-xl p-1 rounded>
    <ToolIcon @click="emit('extract', { schemaType: 'network' })">
      <div i-material-symbols-light:graph-3 />
    </ToolIcon>
  </div>
</template>
