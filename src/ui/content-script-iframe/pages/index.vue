<script setup lang="ts">
import type { SchemaType } from '@/types/extractor'
import ExtractionToolbar from '@/components/ExtractionToolbar/ExtractionToolbar.vue'
import Postmate from 'postmate'

const handshake = new Postmate.Model({})

function handleExtract(params: { schemaType: SchemaType }) {
  handshake.then((parent) => {
    parent.emit('extract', params)
  })
}
</script>

<template>
  <div absolute right-1>
    <ExtractionToolbar
      @extract="handleExtract"
    />
  </div>
</template>
