<script setup lang="ts">
defineProps({
  enableTooltip: {
    type: Boolean,
    default: false,
  },
  tooltipContent: {
    type: String,
    default: '',
  },
  bg: {
    type: Boolean,
    default: false,
  },
  plain: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])
</script>

<template>
  <el-tooltip
    effect="dark"
    :content="tooltipContent"
    :disabled="!enableTooltip"
  >
    <div
      rounded cursor-pointer
      :class="{
        'bg-gray-2': bg,
        'p-1 hover:bg-gray-2': !plain,
        'hover:op-50': plain,
      }"
      @click="emit('click', $event)"
    >
      <slot />
    </div>
  </el-tooltip>
</template>
