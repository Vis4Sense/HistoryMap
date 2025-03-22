<script setup lang="ts">
import { useSchemaMap } from '@/composables/useSchemaMap'
import { useSession } from '@/composables/useSession'

function onExport() {
  const { session } = useSession()
  const { rawNodes } = useSchemaMap()
  const data = {
    title: session.value?.title || '',
    nodes: rawNodes.value,
  }
  const dataStr = JSON.stringify(data, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `SchemaMap-${data.title || 'untitled'}.json`
  a.click()
  URL.revokeObjectURL(url)
  a.remove()
}
</script>

<template>
  <BasicToolbarIcon @click="onExport">
    <div i-mdi-tray-download />
  </BasicToolbarIcon>
</template>
