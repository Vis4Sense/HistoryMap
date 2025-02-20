<script setup lang="ts">
defineProps({
  name: {
    type: String,
    required: true,
  },
  selected: {
    type: Boolean,
    required: true,
  },
  bookmarked: {
    type: Boolean,
    required: true,
  },
  included: {
    type: Boolean,
    required: true,
  },
})
</script>

<template>
  <div
    w-full h-full
    border border-rounded
    p="x-2 y-1"
    bg-white
    hover:shadow
    :class="{
      'border-2': selected,
      'border-dashed text-gray-4': !included,
      'border-amber-3 border-2 text-black': bookmarked,
    }"
    flex gap-1 items-center text-xs
  >
    {{ name }}
  </div>
</template>
