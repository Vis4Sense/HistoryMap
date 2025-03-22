<script setup lang="ts">
import type { Schema } from '@/types/schema'

const id = ref<number>()
const tags = ref<string[]>()
const schema = ref<Schema>()

window.addEventListener('message', (event) => {
  // console.log('event', event)

  const { type, value } = event.data

  switch (type) {
    case 'setId':
      id.value = value
      break
    case 'setTags':
      tags.value = value
      break
    case 'setSchema':
      schema.value = value
      break
  }
})

function onAddTag(value: string) {
  console.log('onAddTag', value)
  window.parent.postMessage({ type: 'add-tag', tag: value, id: id.value }, '*')
}

function removeTag(value: string) {
  window.parent.postMessage({ type: 'remove-tag', tag: value, id: id.value }, '*')
}
</script>

<template>
  <div rounded shadow bg-gray-1 border-2 p="x-2 y-1">
    <el-input-tag
      v-model="tags"
      bg-transparent
      placeholder="Enter tags"
      tag-effect="plain"
      @add-tag="onAddTag"
      @remove-tag="removeTag"
    />
  </div>
</template>

<style>
.el-input-tag__wrapper {
  background-color: transparent;
  box-shadow: none;
}
</style>
