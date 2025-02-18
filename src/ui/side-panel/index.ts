import { i18n } from '@/utils/i18n'
import { notivue } from '@/utils/notifications'
import { pinia } from '@/utils/pinia'
import ElementPlus from 'element-plus'
// import { appRouter } from "@/utils/router"
import { createApp } from 'vue'
import App from './app.vue'

import 'element-plus/dist/index.css'
import './index.scss'
import '@unocss/reset/tailwind.css'

import 'uno.css'

// FIXME: using app router causes stack overflow
appRouter.addRoute({
  path: '/',
  redirect: '/side-panel',
})

const app = createApp(App)
  .use(i18n)
  .use(notivue)
  .use(pinia)
  // .use(appRouter)

app.use(ElementPlus)
app.mount('#app')

/** connect to background so we know when it is closed */
chrome.runtime.connect(undefined, { name: 'historymap' })

export default app

self.onerror = function (message, source, lineno, colno, error) {
  console.info(`Error: ${message}`)
  console.info(`Source: ${source}`)
  console.info(`Line: ${lineno}`)
  console.info(`Column: ${colno}`)
  console.info(`Error object: ${error}`)
}
