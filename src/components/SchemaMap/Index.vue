<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { SchemaNode } from '@/types/schema'
import type { Edge } from '@vue-flow/core'
import MinimisedNode from '@/components/Canvas/nodes/MinimisedNode/Index.vue'
import SchemaMapNode from '@/components/Canvas/nodes/SchemaMapNode/Index.vue'
import SchemaMapNodePinned from '@/components/Canvas/nodes/SchemaMapNode/Pinned.vue'
import { useSchemaMap } from '@/composables/useSchemaMap'
import { Controls } from '@vue-flow/controls'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import _ from 'lodash'
import { compactTreeLayout } from '../HistoryMap/layout/compact-tree'

const { getSelectedNodes, addSelectedNodes, removeSelectedNodes, elementsSelectable } = useVueFlow()
const { nodes: smNodes, links, setSelectedNodeIds, addSchemaNode, updateNode } = useSchemaMap()

const selectionMode = ref<'single' | 'multiple'>('single')

const baseSize = {
  width: 160,
  height: 32,
}
const minimisedSize = {
  width: 16,
  height: 16,
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
    type: node.isMinimised ? 'minimised' : 'schemamap',
    width: getNodeWidth(node),
    height: getNodeHeight(node),
    position: {
      x: 0,
      y: 0,
    },
    data: {
      ...node,
      targets: [] as SchemaNode[],
      // highlighted: true,
    },
  }))

  smNodes.value.forEach((node) => {
    if (node.type === 'schema') {
      node.sources.forEach((source) => {
        const sourceNode = nodes.find(n => n.id === source)
        sourceNode?.data.targets.push(node)
      })
    }
  })

  const layout = compactTreeLayout()
  layout.nodes(nodes).links(edges.value).run()
  layout.close()

  // console.log('nodes', nodes)

  return nodes
})

/** get node sizes */

function getNodeWidth(node: HmPage | SchemaNode): number {
  if (node.isMinimised) {
    return minimisedSize.width
  }
  if (node.width) {
    return node.width
  }
  if (nodeSizeDict.value[node.id]?.width) {
    return nodeSizeDict.value[node.id].width!
  }
  if (node.schema || node.annotations) {
    return baseSize.width * 1.5
  }
  return baseSize.width
  // return nodeSizeDict.value[id]?.width ?? baseSize.width
}

function getNodeHeight(node: HmPage | SchemaNode): number {
  if (node.isMinimised) {
    return minimisedSize.height
  }
  if (node.height) {
    return node.height
  }
  let height = baseSize.height
  const heightDict = nodeSizeDict.value[node.id]?.height ?? {}
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
      'merge',
    )
  }
}

/** open new tab */
function openNewTab() {
  chrome.tabs.create({ url: 'chrome://newtab/' })
}
</script>

<template>
  <div relative>
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
          @resize="(width, height) => updateNode(props.id, { width, height })"
        />
      </template>

      <template #node-minimised="props">
        <MinimisedNode v-bind="props" />
      </template>

      <Controls
        position="bottom-center"
        flex m-1 bg-white
        :show-zoom="false"
        :show-fit-view="false"
        :show-interactive="false"
      >
        <BasicToolbarIcon
          @click="openNewTab"
        >
          <div i-carbon-earth-filled />
        </BasicToolbarIcon>
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

    <SchemaMapNodePinned
      v-for="node in nodes.filter(node => node.data.isPinned)"
      :id="node.id"
      :key="node.id"
      :data="node.data"
      class-name-handle="pinned-node-handle"
    />
  </div>
</template>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/node-resizer/dist/style.css';

.vue-flow__resize-control.line.left {
  border-left-width: 0;
}
.vue-flow__resize-control.line.right {
  border-right-width: 0;
}
.vue-flow__resize-control.line.top {
  border-top-width: 0;
}
.vue-flow__resize-control.line.bottom {
  border-bottom-width: 0;
}

@import "vue-draggable-resizable/style.css";

.pinned-node-handle {
  position: absolute;
  background-color: #777;
  border: 1px solid white;
  border-radius: 50%;
  width: 6px;
  height: 6px;
  transition: all 0.3s ease;
}

.pinned-node-handle-tl {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: nwse-resize;
}

.pinned-node-handle-tm {
  top: 0;
  left: 50%;
  transform: translate(-50%,-50%);
  cursor: ns-resize;
}

.pinned-node-handle-tr {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  cursor: nesw-resize;
}

.pinned-node-handle-mr {
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  cursor: ew-resize;
}

.pinned-node-handle-br {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
  cursor: nwse-resize;
}

.pinned-node-handle-bm {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  cursor: ns-resize;
}

.pinned-node-handle-bl {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
  cursor: nesw-resize;
}

.pinned-node-handle-ml {
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: ew-resize;
}
</style>
