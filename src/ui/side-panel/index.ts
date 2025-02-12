import { i18n } from "@/utils/i18n"
import { notivue } from "@/utils/notifications"
import { pinia } from "@/utils/pinia"
import { appRouter } from "@/utils/router"
import { createApp } from "vue"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import "./index.scss"
import '@unocss/reset/tailwind.css'
import 'uno.css'

import App from "./app.vue"

appRouter.addRoute({
  path: "/",
  redirect: "/side-panel",
})

const app = createApp(App).use(i18n).use(notivue).use(pinia).use(appRouter)

app.use(ElementPlus)
app.mount("#app")

export default app

self.onerror = function (message, source, lineno, colno, error) {
  console.info("Error: " + message)
  console.info("Source: " + source)
  console.info("Line: " + lineno)
  console.info("Column: " + colno)
  console.info("Error object: " + error)
}
