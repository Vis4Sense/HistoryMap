<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { SchemaNode } from '@/types/schema'
import HmPageNodeHeader from '../HmPageNode/Header.vue'

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

const { data } = toRefs(props)

/** send message to controller to open clicked page */
function sendActivatePage() {
  chrome.runtime.sendMessage({
    type: 'activate-page',
    data: data.value,
  })
}
</script>

<template>
  <HmPageNodeHeader
    v-if="data.type === 'hm-page'"
    class="nodrag nopan"
    shrink-0
    text-sm h-5
    cursor-pointer
    hover:text-blue-8
    :data="data"
    @click="sendActivatePage()"
  />
</template>
