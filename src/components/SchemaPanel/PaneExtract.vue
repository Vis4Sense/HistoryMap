<script setup lang="ts">
import PageHeader from '@/components/Canvas/nodes/HmPageNode/Header.vue'
import { useHistoryMap } from '@/composables/useHistoryMap'
import { useSchemaMap } from '@/composables/useSchemaMap'

const { activePage } = useHistoryMap()
const { activeSchemaNode } = useSchemaMap()
</script>

<template>
  <div
    w-full h-full
    grid grid-cols-2 divide-x
    overflow-auto
  >
    <div h-full overflow-auto>
      <SchemaTree
        v-if="activePage"
        :id="activePage.id"
        type="hm-page"
        :schema="activePage.schema ?? undefined"
      >
        <template #header>
          <PageHeader :data="activePage" :height="16" />
        </template>
      </SchemaTree>
    </div>
    <div h-full overflow-auto>
      <SchemaTree
        v-if="activeSchemaNode"
        :id="activeSchemaNode.id"
        type="schema"
        :schema="activeSchemaNode.schema ?? undefined"
      />
    </div>
  </div>
</template>
