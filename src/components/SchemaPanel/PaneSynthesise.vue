<script setup lang="ts">
import PageHeader from '@/components/Canvas/nodes/HmPageNode/Header.vue'
import { useSchemaSynthesise } from '@/composables/useSchemaSynthesise'

const { visibleNodes, activeSchemaNode } = useSchemaSynthesise()
</script>

<template>
  <div w-full h-full flex gap-2>
    <div flex-auto flex w-full gap-2 overflow-auto p-1>
      <div
        v-for="node in visibleNodes" :key="node.id"
        border rounded shadow
        min-w-40 max-w="1/2" py-1
        relative
      >
        <SchemaTree
          :id="node.id"
          :key="node.id"
          :type="node.type"
          :schema="node.schema"
          mode="view"
        >
          <template v-if="node.type === 'hm-page'" #header>
            <PageHeader :data="node" :height="16" mr-8 />
          </template>
        </SchemaTree>

        <div absolute top-2 right-2>
          <div flex gap-1 text="0.6rem">
            <div
              bg-gray-1 rounded-full text-transparent
              hover:bg-yellow hover:text-black cursor-pointer
            >
              <div i-carbon-subtract />
            </div>
            <div
              bg-gray-1 rounded-full text-transparent
              hover:bg-green hover:text-black cursor-pointer
            >
              <div i-carbon-checkmark />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="activeSchemaNode"
      shrink-0
      min-w-40 max-w-60 h-full
      border-l
      shadow='[-10px_0px_10px_-10px_rgba(0,0,0,0.12)]'
      pt-2
    >
      <SchemaTree
        :id="activeSchemaNode.id"
        :type="activeSchemaNode.type"
        :schema="activeSchemaNode.schema ?? undefined"
        mode="edit"
      />
    </div>
  </div>
</template>
