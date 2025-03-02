<script setup lang="ts">
import type { Action, ElMessageBoxOptions } from 'element-plus'
import Icon from '@/components/Basic/ToolbarIcon.vue'
import { useHistoryMap } from '@/composables/useHistoryMap'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { id } = toRefs(props)
const { pages, removePage } = useHistoryMap()

function onRemove() {
  // check if it has children
  const children = pages.value
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
      }
      else {
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
    <div i-carbon:trash-can />
  </Icon>
</template>
