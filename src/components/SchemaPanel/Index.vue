<script setup lang="ts">
import { useSchemaMap } from '@/composables/useSchemaMap'

const { activeSchemaNode } = useSchemaMap()
</script>

<template>
  <div flex flex-col>
    <SchemaPanelHeader shrink-0 />

    <div flex-auto grid grid-cols-2 divide-x>
      <div />
      <div>
        <SchemaTree
          v-if="activeSchemaNode"
          :id="activeSchemaNode.id"
          :schema="activeSchemaNode.schema"
          w-full h-full
        />
      </div>
    </div>
  </div>
</template>
