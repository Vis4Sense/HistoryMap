<script setup lang="ts">
import type { HmPage } from '@/types/historymap'

defineProps({
  data: {
    type: Object as PropType<HmPage>,
    required: true,
  },
})
</script>

<template>
  <div flex gap-1 items-center text-sm>
    <!-- favicon -->
    <img
      v-if="data!.pageObj.favIconUrl"
      h-5
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
