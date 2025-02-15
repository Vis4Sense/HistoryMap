<script setup lang="ts">
import type { Node, Edge } from '@vue-flow/core'  
import { Position, VueFlow } from '@vue-flow/core'
import { useHistoryMap } from '@/composables/useHistoryMap'
import { HmPage } from '@/types/historymap'
import { compactTreeLayout } from './layout/compact-tree'

const { session } = useHistoryMap()

const nodes = computed((): Node<HmPage>[] => {
  if (!session.value) return []
  const nodes = session.value.pages.map((page): Node => ({
    id: page.pageId,
    // type
    width: 160,
    height: 32,
    position: {
      x: 0,
      y: 0
    },
    data: page,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }))

  const layout = compactTreeLayout()
  layout.nodes(nodes).links(edges.value).run()
  layout.close()

  return nodes
})

const edges = computed((): Edge[] => {
  if (!session.value) return []

  const edges: Edge[] = session.value.pages
    .filter((page) => page.parentPageId)
    .map((page) => ({
        id: `${page.pageId}_${page.parentPageId}`,
        source: page.parentPageId!,
        target: page.pageId,
      })
    )

  return edges
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
    </VueFlow>
  </div>
</template>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
