<script setup lang="ts">
import Postmate from 'postmate'

const handshake = new Postmate.Model({})

function onClickTag() {
  handshake.then((parent) => {
    parent.emit('tagging-start')
  })
}

onMounted(() => {
  console.log('note box mounted')
})

const tags = ref<string[]>()
</script>

<template>
  <div w-full rounded shadow bg-blue-1 p="x-2 y-1">
    <el-input-tag
      bg-transparent
      v-model="tags"
      placeholder="Enter tags"
    />
  </div>
</template>

<style>
.el-input-tag__wrapper {
  background-color: transparent;
  box-shadow: none;
}
</style>