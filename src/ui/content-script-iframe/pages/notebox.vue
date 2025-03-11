<script setup lang="ts">
import Postmate from 'postmate'

const id = ref<number>()
const tags = ref<string[]>()

const handshake = new Postmate.Model({
  setId: (value: number) => {
    id.value = value
  },
  setTags: (value: string[]) => {
    tags.value = value
  },
})

function onAddTag(value: string) {
  handshake.then((parent) => {
    parent.emit('add-tag', value)
  })
}

function removeTag(value: string) {
  handshake.then((parent) => {
    parent.emit('remove-tag', value)
  })
}
</script>

<template>
  <div w-full rounded shadow bg-blue-1 p="x-2 y-1">
    <el-input-tag
      bg-transparent
      v-model="tags"
      placeholder="Enter tags"
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
