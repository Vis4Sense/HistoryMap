<script setup lang="ts">
import { useSchemaPanel } from '@/composables/useSchemaPanel'
import PageHeader from '@/components/Canvas/nodes/HmPageNode/Header.vue'
import { HmPage } from '@/types/historymap'

const { visibleNodes } = useSchemaPanel()
</script>

<template>
  <div flex flex-col>
    <SchemaPanelHeader shrink-0 />

    <div
      flex-auto
      grid
      divide-x
      :class="`grid-cols-${visibleNodes.length}`"
    >
      <SchemaTree
        v-for="node in visibleNodes"
        :key="node.id"
        :id="node.id"
        :type="node.type"
        :schema="node.schema || undefined"
      >
        <template #hm-page>
          <PageHeader :data="node as HmPage" />
        </template>
      </SchemaTree>
    </div>
  </div>
</template>
