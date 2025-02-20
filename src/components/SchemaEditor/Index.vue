<script setup lang="ts">
import { useExtractor } from '@/composables/useExtractor'
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import { SchemaType } from '@/types/extraction'

const { setInput, extractNetwork } = useExtractor()
const { setSchema } = useSchemaEditor()

function handleExtract() {
  // fetch page text content from content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length) {
      const tab = tabs[0]
      chrome.tabs.sendMessage(tab.id!, { type: 'fetch-content' }, (response) => {
        // save input to extractor
        setInput({
          schemaType: SchemaType.Network,
          sourceText: response.sourceText,
        })
        // run extraction
        nextTick(() => {
          extractNetwork(output => {
            setSchema(output.schema)
          })
        })
      })
    }
  })
}
</script>

<template>
  <div
    w-full h-full
    border rounded
    flex flex-col overflow-auto
    relative
  >
    <div shrink-0 bg-gray-1 p-1 flex justify-between items-center>
      <BasicToolbarIcon @click="handleExtract">
        <div i-material-symbols-light:graph-3 text-lg></div>
      </BasicToolbarIcon>
    </div>

    <SchemaEditorViewGraph />
  </div>
</template>

<style scoped>
.el-button {
  padding: 0px 6px;
  font-size: 1rem;
}

.el-button.is-text:hover {
  background-color: #ccc;
}

.el-button+.el-button {
  margin-left: 0;
}
</style>
