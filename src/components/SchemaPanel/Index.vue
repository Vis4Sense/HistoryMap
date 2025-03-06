<script setup lang="ts">
import { useSchemaMap } from '@/composables/useSchemaMap'
import { useSchemaPanel } from '@/composables/useSchemaPanel'
import { useSchemaSynthesise } from '@/composables/useSchemaSynthesise'

const { activePane, switchPane } = useSchemaPanel()
const { selectedNodeIds, updateNode } = useSchemaMap()
const { onSynthesise } = useSchemaSynthesise()

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
      flex gap-4 justify-between items-center
      text-sm text-gray-5 font-light
    >
      <div flex gap-4>
        <div
          border-gray p-1 cursor-pointer hover:text-gray-8
          :class="{ 'border-b  text-gray-8': activePane === 'extract' }"
          @click="switchPane('extract')"
        >
          Extract
        </div>
        <div
          border-gray p-1 cursor-pointer hover:text-gray-8
          :class="{ 'text-gray-8 border-b border-gray': activePane === 'synthesize' }"
          @click="switchPane('synthesize')"
        >
          Synthesize
        </div>
      </div>

      <div v-if="activePane === 'synthesize'" px-1>
        <BasicToolbarIcon
          plain
          :enable-tooltip="true"
          tooltip-content="Synthesize"
          @click="onSynthesise()"
        >
          <div i-mdi-atom />
        </BasicToolbarIcon>
      </div>
    </div>

    <div flex-auto>
      <SchemaPanelPaneExtract v-if="activePane === 'extract'" />
      <SchemaPanelPaneSynthesise v-else />
    </div>
  </div>
</template>
