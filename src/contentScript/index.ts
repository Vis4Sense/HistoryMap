import { createApp } from "vue"
import App from './ContentScript.vue'

import '../style.css'

console.info('contentScript is running')

/**
 * Yuhan: this is an attempt to overlay historymap on web pages,
 * However, it doesn't work as expected.
 * The main issue is the timing to inject the overlay,
 * If running content script on document_start, it will be overwritten by the web content;
 * Otherwise, the latency of loading the document would be very distractive.
 */

// const div = document.createElement('div')
// div.style.position = 'fixed'
// div.style.bottom = '0'
// div.style.zIndex = '999999999'
// document.body.appendChild(div)

// createApp(App).mount(div)
