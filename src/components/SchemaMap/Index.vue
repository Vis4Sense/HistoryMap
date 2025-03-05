<script setup lang="ts">
import type { Edge } from '@vue-flow/core'
import HmPageNode from '@/components/Canvas/nodes/HmPageNode/Index.vue'
import SchemaNode from '@/components/Canvas/nodes/SchemaNode/Index.vue'
import { useSchemaMap } from '@/composables/useSchemaMap'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import { compactTreeLayout } from '../HistoryMap/layout/compact-tree'
import _ from 'lodash'

const { getSelectedNodes } = useVueFlow()
const { nodes: smNodes, links, setSelectedNodeIds } = useSchemaMap()

const baseSize = {
  width: 160,
  height: 32,
}
const nodeSizeDict = ref<Record<string, { width: number | null, height: Record<string, number> | null }>>({})

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
    width: getNodeWidth(node.id),
    height: getNodeHeight(node.id),
    position: {
      x: 0,
      y: 0,
    },
    data: node,
  }))

  const layout = compactTreeLayout()
  layout.nodes(nodes).links(edges.value).run()
  layout.close()

  // console.log('nodes', nodes)

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

/** report node selection change */
watch(() => getSelectedNodes.value.map(d => d.id), (newVal, oldVal) => {
  if (_.isEmpty(_.xor(newVal, oldVal)))
    return
  setSelectedNodeIds(newVal)
})
</script>

<template>
  <div>
    <VueFlow
      w-full
      h-full
      :nodes="nodes"
      :edges="edges"
      class="edge-under"
    >
      <template #node-hm-page="props">
        <HmPageNode
          v-bind="props"
          @update-height="updateNodeHeight"
        />
      </template>

      <template #node-schema="props">
        <SchemaNode
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
