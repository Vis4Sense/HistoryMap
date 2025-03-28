import { i18n } from '@/utils/i18n' // Adjust the import path according to your project structure
import { watch } from 'vue'
import { useBrowserLocalStorage } from './useBrowserStorage'

const defaultLocale = 'en'
const localeKey = 'user-locale'

// Use the useBrowserLocalStorage composable to persist the locale
const { data: currentLocale } = useBrowserLocalStorage<string>(localeKey, defaultLocale)

// Initialize the locale from i18n
// currentLocale.value = i18n.global.locale.value

// Watch for changes in the locale and update i18n
watch(currentLocale, (newLocale) => {
  i18n.global.locale.value = newLocale
})

export function useLocale() {
  return currentLocale
}
