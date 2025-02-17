<script setup lang="ts">
import { useHistoryMap } from '@/composables/useHistoryMap'

const { sessions, switchSession } = useHistoryMap()

const sessionList = computed(() => {
  return [
    sessions.value[0],
    ...sessions.value.slice(1)
      .filter(d => d.sessionId) // filter out default session
      .sort((a, b) => b.timeUpdated - a.timeUpdated),
  ]
})
</script>

<template>
  <div
    flex flex-col gap-1
  >
    <div
      v-for="session in sessionList"
      :key="session.sessionId"
      flex items-center rounded
      p="x-3 y-1"
      hover:bg-gray-1 cursor-pointer
      @click="switchSession(session.sessionId)"
    >
      <div
        v-if="session.sessionId === 0"
        mr-2
        i-carbon-folder
      />
      <div truncate>
        {{ session.title }}
      </div>
    </div>
  </div>
</template>
