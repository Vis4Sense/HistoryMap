<script setup lang="ts">
// import Postmate from 'postmate'

// const id = ref<number>()
// const tags = ref<string[]>()

// const handshake = new Postmate.Model({
//   setId: (value: number) => {
//     id.value = value
//   },
//   setTags: (value: string[]) => {
//     tags.value = value
//   },
// })

// function onAddTag(value: string) {
//   handshake.then((parent) => {
//     parent.emit('add-tag', value)
//   })
// }

// function removeTag(value: string) {
//   handshake.then((parent) => {
//     parent.emit('remove-tag', value)
//   })
// }

const id = ref<number>()
const tags = ref<string[]>()

// 监听来自父页面的消息
window.addEventListener('message', (event) => {
  console.log('event', event)
  // if (event.origin !== window.location.origin)
  //   return // 确保是可信来源

  const { type, value } = event.data

  switch (type) {
    case 'setId':
      id.value = value
      break
    case 'setTags':
      tags.value = value
      break
  }
})

// 发送 `add-tag` 和 `remove-tag` 事件到 `parent`
function onAddTag(value: string) {
  console.log('onAddTag', value)
  window.parent.postMessage({ type: 'add-tag', tag: value, id: id.value }, '*')
}

function removeTag(value: string) {
  window.parent.postMessage({ type: 'remove-tag', tag: value, id: id.value }, '*')
}
</script>

<template>
  <div w-full rounded shadow bg-blue-1 p="x-2 y-1">
    <el-input-tag
      v-model="tags"
      bg-transparent
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
