<script setup lang="ts">
import { ElMessageBox, ElMessage, ElMessageBoxOptions, Action } from 'element-plus'
import Icon from './Icon.vue'
import { useHistoryMap } from '@/composables/useHistoryMap'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { id } = toRefs(props)
const { session, removePage } = useHistoryMap()

function onRemove() {
  // check if it has children
  const children = session.value?.pages
    .filter(p => p.parentPageId === id?.value)
  
  const options: ElMessageBoxOptions = {
    confirmButtonText: 'Yes',
    showCancelButton: false,
    type: 'info',
    distinguishCancelAndClose: true,
  }

  if (children && children.length) {
    options.cancelButtonText = 'Yes and delete its children'
    options.showCancelButton = true
  }

  ElMessageBox.confirm(
    'Are you sure you want to delete this page? Close dialog to cancel.',
    'Confirm',
    options,
  )
    .then(() => {
      removePage(id.value)
      ElMessage({
        type: 'success',
        message: 'Page deleted',
      })
    })
    .catch((action: Action) => {
      if (action === 'cancel') {
        removePage(id.value, true)
        ElMessage({
          type: 'success',
          message: 'Page and children deleted',
        })
      } else {
        ElMessage({
          type: 'info',
          message: 'Deletion canceled',
        })
      }
    })
}
</script>

<template>
  <Icon @click="onRemove">
    <div i-carbon:trash-can></div>
  </Icon>
</template>
