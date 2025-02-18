<script setup lang="ts">
import type { HmPage } from '@/types/historymap'
import type { Node } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<Node<HmPage>>()
</script>

<template>
  <div
    w-full h-full
    border border-rounded
    p="x-2 y-1"
    :class="{
      'border-red': props.data!.isActive,
    }"
  >
    <div flex gap-1 items-center text-sm>
      <!-- favicon -->
      <img
        v-if="props.data!.pageObj.favIconUrl"
        h-5
        :src="props.data!.pageObj.favIconUrl"
      >
      <div
        v-else
        i-carbon-earth-filled
        text-gray
      />

      <!-- title -->
      <span truncate>
        {{ props.data!.pageObj.title }}
      </span>
    </div>

    <Handle
      type="source"
      :position="Position.Right"
    />
    <Handle
      type="target"
      :position="Position.Left"
    />
  </div>
</template>
