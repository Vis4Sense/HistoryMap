import type { SchemaType } from '@/types/extraction'
import Postmate from 'postmate'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
// This import scss file is used to style the iframe that is injected into the page
import './index.scss'

// const src = chrome.runtime.getURL('src/ui/content-script-iframe/index.html')

// const handshake = new Postmate({
//   container: document.body,
//   url: src,
//   classListArray: ['historymap-crx-iframe'],
// })

// handshake.then((child) => {
//   console.info('postmate connection established')

//   child.on('extract', handleExtract)
// })

// function handleExtract(data: {
//   schemaType: SchemaType
// }) {
//   const sourceText = document.body.textContent || ''
//   const data_ = {
//     schemaType: data.schemaType,
//     sourceText,
//   }
//   sendMessage('extract', data_, 'background')
// }

self.onerror = function (message, source, lineno, colno, error) {
  console.info(`Error: ${message}`)
  console.info(`Source: ${source}`)
  console.info(`Line: ${lineno}`)
  console.info(`Column: ${colno}`)
  console.info(`Error object: ${error}`)
}

console.info('hello world from content-script')
