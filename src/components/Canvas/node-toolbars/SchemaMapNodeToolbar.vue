<script setup lang="ts">
import ToolMinimise from '../node-tools/ToolMinimise.vue'
import ToolNewSchema from '../node-tools/ToolNewSchema.vue'
import ToolPin from '../node-tools/ToolPin.vue'
import ToolRemove from '../node-tools/ToolRemove.vue'
import ToolRemoveSchema from '../node-tools/ToolRemoveSchema.vue'

defineProps({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String as PropType<'schema' | 'hm-page'>,
    required: true,
  },
})
</script>

<template>
  <div bg-white shadow border p-1 rounded flex>
    <!-- <ToolSchematise :id="id" /> -->
    <ToolRemove v-if="type === 'hm-page'" :id="id" />
    <ToolRemoveSchema v-else :id="id" />

    <ToolMinimise :id="id" />
    <ToolPin :id="id" />

    <ToolNewSchema :id="id" />
  </div>
</template>
