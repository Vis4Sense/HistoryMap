<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { Edge, Node } from '@vue-flow/core'
import { useHistoryMap } from '@/composables/useHistoryMap'
import { VueFlow } from '@vue-flow/core'
import NodeHmPage from '../Canvas/nodes/HmPageNode/Index.vue'
import { compactTreeLayout } from './layout/compact-tree'

const { pages, links } = useHistoryMap()

const edges = computed((): Edge[] => links.value
  .map(link => ({
    id: `${link.source}_${link.target}`,
    source: link.source,
    target: link.target,
  })),
)

const nodes = computed((): Node<HmPage>[] => {
  const nodes = pages.value.map((page): Node => ({
    id: page.id,
    type: 'hm-page',
    width: 160,
    height: 32,
    position: {
      x: 0,
      y: 0,
    },
    data: page,
  }))

  const layout = compactTreeLayout()
  layout.nodes(nodes).links(edges.value).run()
  layout.close()

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
        <NodeHmPage v-bind="props" />
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
