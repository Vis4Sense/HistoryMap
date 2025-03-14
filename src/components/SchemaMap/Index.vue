<script setup lang="ts">
import type { Edge } from '@vue-flow/core'
import SchemaMapNode from '@/components/Canvas/nodes/SchemaMapNode/Index.vue'
import { useSchemaMap } from '@/composables/useSchemaMap'
import { Controls } from '@vue-flow/controls'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import _ from 'lodash'
import { compactTreeLayout } from '../HistoryMap/layout/compact-tree'

const { getSelectedNodes, addSelectedNodes, removeSelectedNodes, elementsSelectable } = useVueFlow()
const { nodes: smNodes, links, setSelectedNodeIds, addSchemaNode } = useSchemaMap()

const selectionMode = ref<'single' | 'multiple'>('single')

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
    type: 'schemamap',
    width: getNodeWidth(node.id),
    height: getNodeHeight(node.id),
    position: {
      x: 0,
      y: 0,
    },
    data: {
      ...node,
      // highlighted: true,
    },
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
  if (!nodeSizeDict.value[id] || !nodeSizeDict.value[id].height) {
    nodeSizeDict.value[id] = {
      width: null,
      height,
    }
  }
  else {
    for (const key in height) {
      nodeSizeDict.value[id].height[key] = height[key]
    }
  }
}

/** report node selection change */
watch(() => getSelectedNodes.value.map(d => d.id), (newVal, oldVal) => {
  if (_.isEmpty(_.xor(newVal, oldVal)))
    return
  setSelectedNodeIds(newVal)
})

/** overwrite default selection behaviour */
onMounted(() => {
  elementsSelectable.value = false
})
function onNodeClick({ event, node }) {
  if (selectionMode.value === 'single') {
    removeSelectedNodes(getSelectedNodes.value)
    addSelectedNodes([node])
  }
  else {
    if (getSelectedNodes.value.includes(node)) {
      removeSelectedNodes([node])
    }
    else {
      addSelectedNodes([...getSelectedNodes.value, node])
    }
  }
}

/** handle creating new schema */
function onAddSchemaNode() {
  // addSchemaNode()
  if (getSelectedNodes.value.length) {
    addSchemaNode(
      getSelectedNodes.value.map(node => node.data.id),
      'merge'
    )
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
      class="edge-under"
      @node-click="onNodeClick"
    >
      <template #node-schemamap="props">
        <SchemaMapNode
          v-bind="props"
          @update-height="updateNodeHeight"
        />
      </template>

      <Controls
        position="bottom-center"
        flex m-1 bg-white
        :show-zoom="false"
        :show-fit-view="false"
        :show-interactive="false"
      >
        <BasicToolbarIcon
          :bg="selectionMode === 'single'"
          @click="selectionMode = 'single'"
        >
          <div i-mdi-cursor-default-outline />
        </BasicToolbarIcon>
        <BasicToolbarIcon
          :bg="selectionMode === 'multiple'"
          @click="selectionMode = 'multiple'"
        >
          <div i-mdi-vector-selection />
        </BasicToolbarIcon>
        <BasicToolbarIcon
          @click="onAddSchemaNode"
        >
          <div i-mdi-puzzle-plus-outline />
        </BasicToolbarIcon>
      </Controls>
    </VueFlow>
  </div>
</template>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
</style>
