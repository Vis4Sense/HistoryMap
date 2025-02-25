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
      p-1 hover:bg-gray-3 rounded cursor-pointer
      :class="{ 'bg-gray-2': bg }"
      @click="emit('click')"
    >
      <slot />
    </div>
  </el-tooltip>
</template>
