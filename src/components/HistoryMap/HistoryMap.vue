<script setup lang="ts">
import { ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'  
import { VueFlow } from '@vue-flow/core'
import { useHistoryMap } from '@/composables/useHistoryMap'

const { session } = useHistoryMap()

const nodes = computed((): Node[] => {
  if (!session.value) return []
  const nodes = session.value.pages.map((page): Node => ({
    id: page.pageId,
    // type
    position: { x: Math.random() * 100, y: Math.random() * 100 },
    data: {
      label: page.pageObj.title,
      ...page
    },
  }))
  return nodes
})

const edges = ref([])
</script>

<template>
  <div>
    <VueFlow
      w-full
      h-full
      :nodes="nodes"
      :edges="edges"
    >
    </VueFlow>
  </div>
</template>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>