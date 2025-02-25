<script setup lang="ts">
import { useExtractor } from '@/composables/useExtractor'
import { SchemaType } from '@/types/extractor'
import TurndownService from 'turndown'

const { input, clippingModal, toggleClipping, extractEgoNetwork } = useExtractor()

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'selected-elements') {
    console.log(request.data)
    const elements = request.data
    if (elements.length) {
      const turndownService = new TurndownService()
      const texts = elements.map(e => turndownService.turndown(e))
      input.value.sourceText = texts.join('\n\n')
    }
    else {
      input.value.sourceText = ''
    }
  }
})

function handleExtract() {
  extractEgoNetwork((result) => {
    console.log(result)
  })
}
</script>

<template>
  <div p-2>
    <div v-if="input.schemaType === SchemaType.EgoNetwork">
      <div>
        <span>Extract concepts related to</span>
        <el-input v-model="input.centralConcept" style="width: 160px; margin-left: 10px;" />
      </div>

      <div>
        <div flex justify-between mb-1>
          <span>Source text</span>
          <BasicToolbarIcon :bg="clippingModal" @click="toggleClipping">
            <div i-carbon-select-window />
          </BasicToolbarIcon>
        </div>
        <el-input
          v-model="input.sourceText"
          type="textarea"
          :rows="3"
          style="width: 100%"
        />
      </div>

      <div mt-2 text-right>
        <el-button size="small" @click="handleExtract">
          Extract
        </el-button>
      </div>
    </div>
  </div>
</template>
