<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { Edge, Node } from '@vue-flow/core'
import { useHistoryMap } from '@/composables/useHistoryMap'
import { VueFlow } from '@vue-flow/core'
import NodeHmPage from '../Canvas/nodes/HmPageNode/Index.vue'
import { compactTreeLayout } from './layout/compact-tree'

const { pages, links } = useHistoryMap()

const baseSize = {
  width: 160,
  height: 32,
}
const nodeSizeDict = ref<Record<string, { width: number | null, height: Record<string, number> | null }>>({})

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
    width: getNodeWidth(page.id),
    height: getNodeHeight(page.id),
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

/** get node sizes */

function getNodeWidth(id: string) {
  return nodeSizeDict.value[id]?.width ?? baseSize.width
}

function getNodeHeight(id: string): number {
  let height = baseSize.height
  const heightDict = nodeSizeDict.value[id]?.height ?? {}
  for (const key in heightDict) {
    height += heightDict[key]
  }
  return height
}

/** update node height */
function updateNodeHeight(id: string, height: Record<string, number>) {
  if (!nodeSizeDict.value[id]) {
    nodeSizeDict.value[id] = {
      width: null,
      height,
    }
  }
  else {
    nodeSizeDict.value[id].height = height
  }
}
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
        <NodeHmPage
          v-bind="props"
          @update-height="updateNodeHeight"
        />
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
