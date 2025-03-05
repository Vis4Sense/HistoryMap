<script setup lang="ts">
import type { Action, ElMessageBoxOptions } from 'element-plus'
import Icon from '@/components/Basic/ToolbarIcon.vue'
import { useSchemaMap } from '@/composables/useSchemaMap'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { id } = toRefs(props)
const { removeNode } = useSchemaMap()

function onRemove() {
  const options: ElMessageBoxOptions = {
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
    showCancelButton: true,
    type: 'info',
  }

  ElMessageBox.confirm(
    'Are you sure you want to delete this node? Close dialog to cancel.',
    'Confirm',
    options,
  )
    .then(() => {
      removeNode(id.value)
      ElMessage({
        type: 'success',
        message: 'Node deleted',
      })
    })
    .catch((action: Action) => {
      ElMessage({
        type: 'info',
        message: 'Deletion canceled',
      })
    })
}
</script>

<template>
  <Icon @click="onRemove">
    <div i-carbon:trash-can />
  </Icon>
</template>
