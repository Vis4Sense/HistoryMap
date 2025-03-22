<script setup lang="ts">
defineProps({
  bg: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    flex justify-center items-center
    rounded-full
    w-3 h-3
    text="0.5rem"
    cursor-pointer
    hover:bg-gray-3
    :class="{
      'bg-gray-3': bg,
      'bg-gray-1': !bg,
    }"
  >
    <slot></slot>
  </div>
</template>
