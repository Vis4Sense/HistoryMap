<script setup lang="ts">
import HistoryMap from '@/components/HistoryMap/HistoryMap.vue'
// import { Notivue, Notification } from 'notivue'
</script>

<template>
  <main class="w-screen h-screen text-gray-700 text-base">
    <div
      w-full
      h-full
      flex
      flex-col
      overflow-auto
    >
      <div
        flex
        gap-2
        text-lg
        bg-gray-1
        p="x-4 y-2"
      >
        <div i-carbon-menu />
        <div i-carbon-folder-add />
      </div>

      <div
        p-4
        flex-auto
      >
        <div class="text-lg font-bold">History Map</div>
        <HistoryMap
          w-full
          h-full
        />
      </div>
    </div>
  </main>
</template>

<style scoped></style>
