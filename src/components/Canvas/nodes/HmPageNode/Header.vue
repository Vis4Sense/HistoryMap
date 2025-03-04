<script setup lang="ts">
import type { HmPage } from '@/types/historymap'

defineProps({
  data: {
    type: Object as PropType<HmPage>,
    required: true,
  },
  height: {
    type: Number,
    default: null,
  }
})
</script>

<template>
  <div flex gap-1 items-center
    :style="`height: ${height}px`"
  >
    <!-- favicon -->
    <img
      v-if="data!.pageObj.favIconUrl"
      h-full
      :src="data!.pageObj.favIconUrl"
    >
    <div
      v-else
      i-carbon-earth-filled
      text-gray
    />

    <!-- title -->
    <span truncate>
      {{ data!.pageObj.title }}
    </span>
  </div>
</template>
