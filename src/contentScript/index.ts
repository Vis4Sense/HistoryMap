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

// function createAndMountDiv(maxRetry = 50) {
//   try {
//     const div = document.createElement('div');
//     div.style.position = 'fixed';
//     div.style.bottom = '0';
//     div.style.left = '50%';
//     div.style.zIndex = '999999999';

//     if (document && document.body) {
//       document.body.appendChild(div);
//       createApp(App).mount(div);
//       _div = div;
//       console.log('div created and mounted');
//     } else {
//       // console.error('document is not ready yet, retrying...');
//       setTimeout(() => {
//         createAndMountDiv(maxRetry);
//       }, 200);
//     }
//   } catch (error) {
//     // console.error('Failed to create and mount div:', error);
//     if (maxRetry <= 0) {
//       console.error('Max retry reached, giving up...');
//     }
//     else {
//       setTimeout(() => {
//         createAndMountDiv();
//       }, 200);
//     }
//   }
// }

// let _div = null;
// createAndMountDiv();

// const observer = new MutationObserver((mutationsList) => {
//   for (const mutation of mutationsList) {
//     if (mutation.type === 'childList') {
//       const removedNodes = Array.from(mutation.removedNodes);
//       if (removedNodes.includes(_div)) {
//         console.log('div was removed, recreating...');
//       }
//     }
//   }
// });

// observer.observe(document.body, { childList: true, subtree: true });
