import type { SchemaType } from '@/types/extractor'
import Postmate from 'postmate'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'
// This import scss file is used to style the iframe that is injected into the page
import './index.scss'

import './select-element'
import './annotation'

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

// add listener when document is ready
// document.addEventListener('DOMContentLoaded', () => {
//   console.info('document ready')
//   sendMessage('content-script-ready', null, 'background')
// })

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.info('message', message)
  if (message.type === 'fetch-content') {
    const docClone = document.implementation.createHTMLDocument('Cloned Document')
    docClone.body.innerHTML = document.body.innerHTML
    const article = new Readability(docClone).parse()

    const turndownService = new TurndownService()
    const markdown = turndownService.turndown(article?.content || '')

    sendResponse({ sourceText: markdown })
  }
  return true
})

self.onerror = function (message, source, lineno, colno, error) {
  console.info(`Error: ${message}`)
  console.info(`Source: ${source}`)
  console.info(`Line: ${lineno}`)
  console.info(`Column: ${colno}`)
  console.info(`Error object: ${error}`)
}

console.info('hello world from content-script')
