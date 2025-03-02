<script setup lang="ts">
import type { Edge } from '@vue-flow/core'
import HmPageNode from '@/components/Canvas/nodes/HmPageNode.vue'
import SchemaNode from '@/components/Canvas/nodes/SchemaNode.vue'
import { useSchemaMap } from '@/composables/useSchemaMap'
import { VueFlow } from '@vue-flow/core'
import { compactTreeLayout } from '../HistoryMap/layout/compact-tree'

const { nodes: smNodes, links } = useSchemaMap()

const edges = computed((): Edge[] => {
  return links.value.map(link => ({
    id: `${link.source}_${link.target}`,
    source: link.source,
    target: link.target,
  }))
})

const nodes = computed(() => {
  const nodes = smNodes.value.map(node => ({
    id: node.id,
    type: node.type,
    width: 160,
    height: 32,
    position: {
      x: 0,
      y: 0,
    },
    data: node,
  }))

  const layout = compactTreeLayout()
  layout.nodes(nodes).links(edges.value).run()
  layout.close()

  console.log('nodes', nodes)

  return nodes
})
</script>

<template>
  <div>
    <VueFlow
      w-full
      h-full
      :nodes="nodes"
      :edges="edges"
    >
      <template #node-hm-page="props">
        <HmPageNode v-bind="props" />
      </template>

      <template #node-schema="props">
        <SchemaNode v-bind="props" />
      </template>
    </VueFlow>
  </div>
</template>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
