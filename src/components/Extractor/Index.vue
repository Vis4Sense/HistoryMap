<script setup lang="ts">
import { useExtractor } from '@/composables/useExtractor'

const { modal } = useExtractor()
</script>

<template>
  <div border border-rounded>
    <ExtractorHeader />
    <ExtractorInputs v-if="modal" />
  </div>
</template>
