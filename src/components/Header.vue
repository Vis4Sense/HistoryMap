<script setup lang="ts">
import { useHistoryMap } from '@/composables/useHistoryMap'

const { session, addSession, updateSession } = useHistoryMap()

const sessionTitle = ref(null as HTMLDivElement | null)

function updateSessionTitle() {
  if (session.value && sessionTitle.value) {
    const title = sessionTitle.value.textContent?.trim() || ''
    if (title) {
      updateSession(session.value.sessionId, { title })
    }
  }
}
</script>

<template>
  <div w-full p="x-2 y-1" flex text-lg bg-gray-1>
    <div shrink-0>
      <el-popover
        trigger="click"
        :show-arrow="false"
      >
        <template #reference>
          <el-button text>
            <div i-carbon-menu />
          </el-button>
        </template>
        <SessionList />
      </el-popover>

      <el-tooltip
        effect="dark"
        content="New session"
      >
        <el-button
          text
          @click="addSession('')"
        >
          <div i-carbon-folder-add />
        </el-button>
      </el-tooltip>
    </div>

    <div flex-auto flex justify-center>
      <div
        ref="sessionTitle" max-w-40 truncate
        contenteditable
        @blur="updateSessionTitle"
        @keydown.enter.prevent="(e) => e.target.blur()"
      >
        {{ session?.title }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.el-button {
  padding: 0px 6px;
  font-size: 1rem;
}

.el-button.is-text:hover {
  background-color: #d9d9d9;
}

.el-button+.el-button {
  margin-left: 0;
}
</style>
