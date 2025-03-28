<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'

const currentLocale = useLocale()
const labelDict = {
  en: 'En',
  zh: '中',
}

function switchLanguage() {
  if (currentLocale.value === 'en') {
    currentLocale.value = 'zh'
  }
  else {
    currentLocale.value = 'en'
  }
}
</script>

<template>
  <BasicToolbarIcon plain @click="switchLanguage()">
    <div text-sm w-5>
      {{ labelDict[currentLocale] }}
    </div>
  </BasicToolbarIcon>
</template>
