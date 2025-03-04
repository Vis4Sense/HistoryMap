<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import PageHeader from '@/components/Canvas/nodes/HmPageNode/Header.vue'
import { useSchemaPanel } from '@/composables/useSchemaPanel'

const { visibleNodes } = useSchemaPanel()
</script>

<template>
  <div flex flex-col py-1 overflow-auto>
    <!-- <SchemaPanelHeader shrink-0 /> -->

    <div
      flex-auto
      grid
      divide-x
      overflow-auto
      :class="`grid-cols-${visibleNodes.length}`"
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
