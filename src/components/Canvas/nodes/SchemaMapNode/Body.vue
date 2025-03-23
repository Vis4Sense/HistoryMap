<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { SchemaNode } from '@/types/schema'
import HmPageNodeAnnotation from '../HmPageNode/Annotation.vue'
import SchemaNodeTree from '../SchemaNode/Tree.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object as PropType<HmPage | SchemaNode>,
    required: true,
  },
})

const { id, data } = toRefs(props)
</script>

<template>
  <div
    v-if="data.type === 'hm-page'
      && data.annotations
    "
    p-1
    space-y-1
  >
    <HmPageNodeAnnotation
      v-for="annotation in data.annotations"
      :id="id"
      :key="annotation.id"
      :annotation="annotation"
    />
  </div>

  <div
    v-else-if="data.type === 'schema'"
    text-xs
    @click="e => e.stopPropagation()"
  >
    <SchemaNodeTree
      :id="id"
      :schema="data.schema"
    />
  </div>
</template>
