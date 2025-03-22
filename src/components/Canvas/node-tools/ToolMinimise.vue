<script setup lang="ts">
import { useSchemaMap } from '@/composables/useSchemaMap'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { id } = toRefs(props)

function onMinimise() {
  const { updateNode } = useSchemaMap()
  updateNode(id.value, { isMinimised: true })
}
</script>

<template>
  <BasicToolbarIcon @click="onMinimise">
    <div i-mdi-minus />
  </BasicToolbarIcon>
</template>
