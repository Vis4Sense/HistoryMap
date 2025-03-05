<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import PageHeader from '@/components/Canvas/nodes/HmPageNode/Header.vue'
import { useSchemaPanel } from '@/composables/useSchemaPanel'
import { useSchemaMap } from '@/composables/useSchemaMap'

const { visibleNodes, activePane } = useSchemaPanel()
const { selectedNodeIds, updateNode } = useSchemaMap()

watch(selectedNodeIds, (nodes) => {
  // single selection of schema node
  if (nodes.length === 1 && nodes[0].startsWith('sm-') && activePane.value === 'extract') {
    updateNode(nodes[0], { isActive: true })
  }
}, { deep: true })
</script>

<template>
  <div flex flex-col overflow-auto gap-2 px-2>
    <!-- <SchemaPanelHeader shrink-0 /> -->
    <div
      mt-1
      flex gap-4
      text-sm text-gray-5 font-light
    >
      <div
        border-gray p-1
        :class="{ 'border-b  text-gray-8': activePane === 'extract' }"
      >
        Extract
      </div>
      <div
        border-gray p-1
        :class="{ 'text-gray-8 border-b border-gray': activePane === 'synthesize' }"
      >
        Synthesize
      </div>
    </div>

    <div
      flex-auto
      grid
      divide-x
      overflow-auto
      :style="{
        gridTemplateColumns: `repeat(${visibleNodes.length}, 1fr)`,
      }"
    >
      <SchemaTree
        v-for="node in visibleNodes"
        :id="node.id"
        :key="node.id"
        :type="node.type"
        :schema="node.schema || undefined"
        :sync="node.sync"
      >
        <template #hm-page>
          <PageHeader :data="(node as HmPage)" :height="16" />
        </template>
      </SchemaTree>
    </div>
  </div>
</template>
