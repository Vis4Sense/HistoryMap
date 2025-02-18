<script setup lang="ts">
import HistoryMap from '@/components/HistoryMap/HistoryMap.vue'

onMounted(() => {
  /** connect to background so we know when it is closed */
  chrome.runtime.connect(undefined, { name: 'historymap' })
})
</script>

<template>
  <main class="w-screen h-screen text-gray-700 text-base">
    <div w-full h-full overflow-auto flex flex-col>
      <Header />

      <div p-4 flex-auto>
        <HistoryMap w-full h-full />
      </div>
    </div>
  </main>
</template>
