<script setup lang="ts">
import { HmPage } from '@/types/historymap';
import type { Node } from '@vue-flow/core'

const props = defineProps<Node<HmPage>>()
</script>

<template>
  <div
    w-full
    h-full  
    border
    border-rounded
    p="x-2 y-1"
  >
    <div
      flex
      gap-1
      items-center
      text-sm
    >
      <!-- favicon -->
      <img
        v-if="props.data!.pageObj.favIconUrl"
        :src="props.data!.pageObj.favIconUrl"
      />
      <div
        v-else
        i-carbon-earth-filled
        text-gray
      ></div>

      <!-- title -->
      <span>
        {{ props.data!.pageObj.title }}
      </span>
    </div>
  </div>
</template>
