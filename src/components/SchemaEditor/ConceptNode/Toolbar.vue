<script setup lang="ts">
defineProps({
  id: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div bg-white shadow border p-1 rounded flex>
    <BasicToolbarIcon>
      <div i-carbon-bookmark></div>
    </BasicToolbarIcon>
  </div>
</template>
