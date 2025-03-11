/**
 * @fileoverview Highlighting
 *
 * Highlighting is done using the rangy library.
 * @see {@link https://github.com/timdown/rangy}
 *
 * Specifically, these demos might be useful:
 *
 * @see {@link https://github.com/timdown/rangy/blob/master/demos/highlighter.html}
 * Example usage of highlighter
 *
 * @see {@link https://github.com/timdown/rangy/blob/master/demos/core.html}
 * Example usage of rangy range object
 *
 * More details on the APIs can be found in these documents:
 *
 * @see {@link https://github.com/timdown/rangy/wiki/Highlighter-Module}
 */

import type { Annotation } from '@/types/historymap'
import _ from 'lodash'
import Postmate from 'postmate'
import rangy from 'rangy'
import { sendMessage } from 'webext-bridge/content-script'
import 'rangy/lib/rangy-selectionsaverestore'
import 'rangy/lib/rangy-classapplier'
import 'rangy/lib/rangy-highlighter'
import 'rangy/lib/rangy-serializer'
import 'rangy/lib/rangy-textrange'

let annotations: Annotation[] = []
let selectedAnnotation: Annotation | null = null

rangy.init()
const highlighter = rangy.createHighlighter()

/** toolbar iframe */
function initialiseToolbar() {
  const src = chrome.runtime.getURL('src/ui/content-script-iframe/index.html#/toolbar')

  const handshake = new Postmate({
    container: document.body,
    url: src,
    classListArray: ['historymap-selection-toolbar-iframe'],
  })

  handshake.then((child) => {
    // handle text selection
    document.addEventListener('mouseup', (event) => {
      selectionHandler(event, child)
    })

    // handle click highlight
    child.on('highlight', highlightHandler)

    // handle click dehighlight
    child.on('dehighlight', (id: number) => {
      dehighlightHandler(id)
    })

    // child.on('tagging-start', () => {
    //   console.log('tagging-start')
    //   // const rect = child.frame.getBoundingClientRect()
    //   const rect = getSelectionRect()
    //   // const handshake = createNoteBox(rect)
    // })
  })
}

/** note container iframe */
function createNoteBox(rect: DOMRect) {
  const src = chrome.runtime.getURL('src/ui/content-script-iframe/index.html#/notebox')
  const handshake = new Postmate({
    container: document.body,
    url: src,
    classListArray: ['historymap-note-box-iframe'],
  })

  handshake.then((child) => {
    child.frame.style.top = `${rect.top}px`
  })

  return handshake
}

/** text selection listener */
function selectionHandler(event: MouseEvent, toolbar: Postmate.ParentAPI) {
  const selection = rangy.getSelection()
  const frame = toolbar.frame

  // if click on marked text, show toolbar
  const target = event.target as HTMLElement
  if (target.classList.contains('highlight')) {
    const id = Number.parseInt(target.getAttribute('annotation-id') ?? '')
    if (Number.isNaN(id))
      return

    const elements = document.querySelectorAll(`[annotation-id="${id}"]`)

    // bounding rect of elements
    const rects = Array.from(elements).map(element => element.getBoundingClientRect())
    const rect = rects.reduce((acc, rect) => {
      acc.left = Math.min(acc.left, rect.left)
      acc.top = Math.min(acc.top, rect.top)
      acc.right = Math.max(acc.right, rect.right)
      acc.bottom = Math.max(acc.bottom, rect.bottom)
      return acc
    }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })

    const annotation = annotations.find(d => d.id === id)
    if (annotation) {
      setSelectedAnnotation(annotation, toolbar)
      showToolbar(frame, rect)
    }
    return
  }

  if (selection.isCollapsed) {
    frame.style.visibility = 'hidden'
    setSelectedAnnotation(null, toolbar)
    return
  }
  const rect = getSelectionRect()
  showToolbar(frame, rect)
}

/** highlight handler */
function highlightHandler() {
  const selection = rangy.getSelection()
  if (selection.isCollapsed) {
    return
  }

  const sourceText = selection.toString()
  const uuidPattern = /\{([a-f0-9\-]+)\}$/i
  const serialized = rangy.serializeSelection(selection)
    .replace(uuidPattern, '')

  const id = _.max(annotations.map(d => d.id + 1)) || 0

  // send message to background
  sendMessage('highlight', {
    id,
    selection: serialized,
    sourceText,
  }, 'background')
    .then((annotation: Annotation | null) => {
      if (annotation) {
        annotations.push(annotation)
        highlighter.addClassApplier(rangy.createClassApplier('highlight', {
          ignoreWhiteSpace: true,
          tagNames: ['span', 'a'],
          elementAttributes: {
            'annotation-id': id,
          },
        }))
        highlighter.highlightSelection('highlight')
      }
    })
}

/** dehighlight handler */
function dehighlightHandler(id: number) {
  const annotation = annotations.find(d => d.id === id)
  if (!annotation) return

  sendMessage('dehighlight', annotation, 'background')
    .then(() => {
      const el = document.querySelector(`[annotation-id="${id}"]`)
      if (el) {
        const highlight = highlighter.getHighlightForElement(el)
        highlight.unapply()
        annotations = annotations.filter(d => d.id !== annotation.id)
      }
    })
}

/** load highlights */
function restoreHighlights() {
  // wait for document loading complete
  if (document.readyState !== 'complete') {
    setTimeout(() => {
      restoreHighlights()
    }, 1500)
    return
  }

  const highlights = annotations.filter(annotation => annotation.highlighted)
  console.log('restoring highlights', highlights)

  highlights.forEach((annotation) => {
    const selection = rangy.deserializeSelection(annotation.selection)
    highlighter.addClassApplier(rangy.createClassApplier('highlight', {
      ignoreWhiteSpace: true,
      tagNames: ['span', 'a'],
      elementAttributes: {
        'annotation-id': annotation.id,
      },
    }))
    highlighter.highlightSelection('highlight')
    selection.removeAllRanges()
  })
}

/** utilities */

function showToolbar(frame: HTMLIFrameElement, rect: DOMRect) {
  frame.style.visibility = 'visible'
  frame.style.top = `${rect.top + window.scrollY}px`
  frame.style.left = `${(rect.left + rect.right) / 2}px`
}

function getSelectionRect() {
  const selection = rangy.getSelection()
  const range = selection.getRangeAt(0)
  return range.nativeRange.getBoundingClientRect()
}

function setSelectedAnnotation(annotation: Annotation | null, toolbar: Postmate.ParentAPI) {
  toolbar.call('setAnnotation', annotation)
}

/** load stored annotations */
async function loadAnnotations() {
  console.info('fetching annotations')
  const response = await sendMessage('fetch-annotations', null, 'background')
  if (response) {
    annotations = response as Annotation[]
  }

  restoreHighlights()
}

/** initialise */
async function initialise() {
  await loadAnnotations()

  initialiseToolbar()
}

initialise()
