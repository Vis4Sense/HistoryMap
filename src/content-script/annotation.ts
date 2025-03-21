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
import TurndownService from 'turndown'
import { sendMessage, onMessage } from 'webext-bridge/content-script'
import 'rangy/lib/rangy-selectionsaverestore'
import 'rangy/lib/rangy-classapplier'
import 'rangy/lib/rangy-highlighter'
import 'rangy/lib/rangy-serializer'
import 'rangy/lib/rangy-textrange'

type Rect = Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>

let annotations: Annotation[] = []
let selectedAnnotation: Annotation | null = null
const noteboxes: Record<number, HTMLIFrameElement> = {}
let toolbar: Postmate

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

    child.on('highlight', highlightHandler)
    child.on('dehighlight', dehighlightHandler)

    child.on('tagging-start', taggingStartHandler)

    child.on('extract-outline', extractOutlineHandler)

    child.on('delete', deleteHandler)
  })

  // or the messages could be from context menu
  onMessage('highlight', highlightHandler)
  onMessage('dehighlight', dehighlightHandler)
  onMessage('tagging-start', taggingStartHandler)
  onMessage('extract-outline', extractOutlineHandler)
  onMessage('delete', deleteHandler)

  toolbar = handshake
}

/** note container iframe */
function createNoteBox(id: number, rect: Rect) {
  console.log('creating notebox', id, rect)

  const src = chrome.runtime.getURL('src/ui/content-script-iframe/index.html#/notebox')
  const iframe = document.createElement('iframe')
  iframe.src = `${src}`
  iframe.classList.add('historymap-note-box-iframe')
  iframe.removeAttribute('sandbox')
  document.body.appendChild(iframe)

  iframe.onload = () => {
    // FIXME: more robust way to ensure the message is sent?
    setTimeout(() => {
      iframe.contentWindow?.postMessage({ type: 'setId', value: id }, '*')
      iframe.contentWindow?.postMessage({
        type: 'setTags',
        value: annotations.find(d => d.id === id)?.tags || [],
      }, '*')
      iframe.contentWindow?.postMessage({
        type: 'setSchema',
        value: annotations.find(d => d.id === id)?.schema || null,
      }, '*')
    }, 1000)
    iframe.style.top = `${rect.top + window.scrollY}px`
  }

  noteboxes[id] = iframe
}

function noteChangeHandler(event) {
  const type = event.data.type
  if (!type)
    return

  if (type === 'add-tag' || type === 'remove-tag') {
    const { tag, id } = event.data
    sendMessage(type, { id, tag }, 'background')
      .then((annotation: Annotation | null) => {
        if (annotation) {
          updateAnnotation(annotation)
          // console.log(annotations)
        }
      })
  }
}

/** text selection listener */
function selectionHandler(event: MouseEvent) {
  const selection = rangy.getSelection()

  // if click on marked text, show toolbar
  const target = event.target as HTMLElement
  if (target.hasAttribute('hm-annotation')) {
    const id = Number.parseInt(target.getAttribute('annotation-id') ?? '')
    if (Number.isNaN(id))
      return

    const rect = getAnnotationBoundingRect(id)
    const annotation = annotations.find(d => d.id === id)
    if (annotation) {
      setSelectedAnnotation(annotation)
      toolbar.then((child) => {
        showToolbar(child.frame, rect)
      })
    }
    return
  }

  if (selection.isCollapsed) {
    toolbar.then((child) => {
      child.frame.style.visibility = 'hidden'
    })
    setSelectedAnnotation(null)
    return
  }

  const rect = getSelectionRect()
  toolbar.then((child) => {
    showToolbar(child.frame, rect)
  })
}

/** deletion handler */
function deleteHandler() {
  if (selectedAnnotation) {
    const { id } = selectedAnnotation
    sendMessage('delete', { id }, 'background')
      .then(() => {
        annotations = annotations.filter(d => d.id !== id)
        if (id in noteboxes)
          noteboxes[id].remove()

        const el = document.querySelector(`[annotation-id="${id}"]`)
        if (el) {
          const highlight = highlighter.getHighlightForElement(el)
          if (highlight) {
            highlight.unapply()
          }
        }
      })
  }
}

/** highlight handler */
function highlightHandler() {
  if (selectedAnnotation) {
    const { id, selection, sourceText } = selectedAnnotation
    sendMessage('highlight', { id, selection, sourceText }, 'background')
    document.querySelectorAll(`[annotation-id="${id}"]`).forEach((element) => {
      element.classList.add('highlight')
      element.classList.remove('annotate')
    })
  }
  else {
    saveAnnotation('highlight')
  }
}

/** dehighlight handler */
function dehighlightHandler() {
  const id = selectedAnnotation?.id
  const annotation = annotations.find(d => d.id === id)
  console.log('dehighlight', id, annotation)
  if (!annotation)
    return

  sendMessage('dehighlight', annotation, 'background')
    .then(() => {
      const el = document.querySelector(`[annotation-id="${id}"]`)
      if (el) {
        const highlight = highlighter.getHighlightForElement(el)
        highlight.unapply()

        // FIXME: there may be tags/schema, should not remove annotation directly
        annotations = annotations.filter(d => d.id !== annotation.id)
      }
    })
}

/** restore marks */
function restoreHighlights() {
  // wait for document loading complete
  if (document.readyState !== 'complete') {
    setTimeout(() => {
      restoreHighlights()
    }, 1500)
    return
  }

  console.log('restoring highlights')

  annotations.forEach((annotation) => {
    const type = annotation.highlighted ? 'highlight' : 'annotate'
    const selection = rangy.deserializeSelection(annotation.selection)
    highlighter.addClassApplier(rangy.createClassApplier(type, {
      ignoreWhiteSpace: true,
      tagNames: ['span', 'a'],
      elementAttributes: {
        'annotation-id': annotation.id,
        'hm-annotation': true,
      },
    }))
    highlighter.highlightSelection(type)
    selection.removeAllRanges()
  })

  // restore noteboxes
  nextTick(() => {
    restoreNoteboxes()
  })
}

function restoreNoteboxes() {
  console.log('restoring noteboxes')
  annotations.forEach((annotation) => {
    if ('tags' in annotation && annotation.tags!.length > 0) {
      const rect = getAnnotationBoundingRect(annotation.id)
      createNoteBox(annotation.id, rect)
    }
  })
}

/** handle start tagging */
async function taggingStartHandler() {
  if (!selectedAnnotation) {
    await saveAnnotation('annotate')
  }
  if (!selectedAnnotation)
    return

  const rect = getAnnotationBoundingRect(selectedAnnotation.id)

  if (selectedAnnotation.id in noteboxes === false) {
    const handshake = createNoteBox(selectedAnnotation.id, rect)
  }
}

/** handle extracting outline */
async function extractOutlineHandler() {
  if (!selectedAnnotation) {
    await saveAnnotation('annotate')
  }
  if (!selectedAnnotation)
    return

  const text = selectedAnnotation.sourceText
  console.log('extracting outline', text)

  const annotation = await sendMessage('extract-outline', selectedAnnotation, 'background') as Annotation
  noteboxes[selectedAnnotation.id]?.contentWindow?.postMessage({
    type: 'setSchema',
    value: annotation.schema,
  }, '*')
  console.log('extracted outline', annotation)
}

/** utilities */

function showToolbar(frame: HTMLIFrameElement, rect: Rect) {
  frame.style.visibility = 'visible'
  frame.style.top = `${rect.top + window.scrollY}px`
  frame.style.left = `${(rect.left + rect.right) / 2}px`
}

function getSelectionRect() {
  const selection = rangy.getSelection()
  const range = selection.getRangeAt(0)
  return range.nativeRange.getBoundingClientRect()
}

function updateAnnotation(annotation: Annotation) {
  const index = annotations.findIndex(d => d.id === annotation.id)
  if (index >= 0) {
    annotations[index] = annotation
  }
}

function mergeAnnotation(annotation: Annotation) {
  if (annotations.find(d => d.id === annotation.id)) {
    updateAnnotation(annotation)
  }
  else {
    annotations.push(annotation)
  }
}

async function setSelectedAnnotation(annotation: Annotation | null) {
  await toolbar.then((child) => {
    child.call('setAnnotation', annotation)
  })
  selectedAnnotation = annotation
}

function getAnnotationBoundingRect(id: number): Rect {
  const elements = document.querySelectorAll(`[annotation-id="${id}"]`)
  const rects = Array.from(elements).map(element => element.getBoundingClientRect())
  return rects.reduce((acc, rect) => {
    acc.left = Math.min(acc.left, rect.left)
    acc.top = Math.min(acc.top, rect.top)
    acc.right = Math.max(acc.right, rect.right)
    acc.bottom = Math.max(acc.bottom, rect.bottom)
    return acc
  }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })
}

function selection2markdown(selection: RangySelection) {
  const range = selection.getRangeAt(0)
  const clonedDoc = document.implementation.createHTMLDocument()
  clonedDoc.body.appendChild(range.cloneContents())

  const turndownService = new TurndownService()
  return turndownService.turndown(clonedDoc.body.innerHTML)
}

async function saveAnnotation(type: 'highlight' | 'annotate' = 'highlight') {
  const selection = rangy.getSelection()
  if (selection.isCollapsed) {
    return
  }

  let sourceText = selection.toString()
  try {
    sourceText = selection2markdown(selection)
  }
  catch {}

  const uuidPattern = /\{([a-f0-9\-]+)\}$/i
  const serialized = rangy.serializeSelection(selection)
    .replace(uuidPattern, '')

  const id = _.max(annotations.map(d => d.id + 1)) || 0

  // send message to background
  const annotation = await sendMessage(type, {
    id,
    selection: serialized,
    sourceText,
  }, 'background') as Annotation | null

  if (annotation) {
    console.log('annotation', annotation)
    mergeAnnotation(annotation)
    highlighter.addClassApplier(rangy.createClassApplier(type, {
      ignoreWhiteSpace: true,
      tagNames: ['span', 'a'],
      elementAttributes: {
        'annotation-id': id,
        'hm-annotation': true,
      },
    }))
    highlighter.highlightSelection(type)
    await setSelectedAnnotation(annotation)
  }

  return annotation
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
  window.addEventListener('message', noteChangeHandler)
}

initialise()
