<script setup lang="ts">
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
        <!-- <HistoryMap w-full h-full /> -->
        <SchemaMap w-full h-full />
      </div>

      <SchemaPanel shrink-0 h-80 border-t="1.5" />

      <!-- <el-dialog v-model="schemaEditorModal"
        title="Schema Editor"
        width="96%" h="90%" top="5%"
        class="body-h-full"
        overflow-auto
      >
        <SchemaEditor />
      </el-dialog> -->
    </div>
  </main>
</template>

<style>
.el-dialog.body-h-full {
  display: flex;
  flex-direction: column;
}

.body-h-full .el-dialog__body {
  flex: 1;
  overflow: auto;
}
</style>
