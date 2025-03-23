<script setup lang="ts">
import { useSchemaMap } from '@/composables/useSchemaMap'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { id } = toRefs(props)

function onPin() {
  const { updateNode } = useSchemaMap()
  updateNode(id.value, { isPinned: true })
}
</script>

<template>
  <BasicToolbarIcon @click="onPin">
    <div i-mdi-pin-outline />
  </BasicToolbarIcon>
</template>
