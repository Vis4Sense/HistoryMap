/**
 * @see {@link https://github.com/serversideup/webext-bridge}
 *
 * document
 * @see {@link https://serversideup.net/open-source/webext-bridge/docs}
 */

import type { Annotation } from '@/types/historymap'
import type { Schema } from '@/types/schema.d'
import { useHistoryMap } from '@/composables/useHistoryMap'
import { getCurrentConcepts } from '@/composables/useSchemaMap'
import { chatCompletionText } from '@/services/llm'
import { newSchema } from '@/types/schema.d'
import { onMessage, sendMessage } from 'webext-bridge/background'
import { updateActivePage } from './controller'

const { activePage, addAnnotation, updateAnnotation, removeAnnotation, removeHighlight, highlight, addTag, removeTag } = useHistoryMap()

onMessage('fetch-annotations', () => {
  updateActivePage()
  return activePage.value?.annotations || []
})

onMessage('delete', ({ data }) => {
  if (activePage.value) {
    const { id } = data as { id: number }
    removeAnnotation(activePage.value.id, id)
  }
})

onMessage('highlight', ({ data }) => {
  const { id, selection, sourceText } = data as {
    id: number
    selection: string
    sourceText: string
  }
  if (activePage.value) {
    let annotation = activePage.value.annotations?.find(d => d.id === id) || null
    if (annotation) {
      highlight(activePage.value.id, id)
    }
    else {
      annotation = addAnnotation(
        activePage.value.id,
        id,
        selection,
        sourceText,
        true,
      )
    }
    if (annotation) {
      return annotation
    }
  }
  return null
})

onMessage('dehighlight', ({ data }) => {
  if (activePage.value) {
    const annotation = data as Annotation
    removeHighlight(activePage.value.id, annotation.id)
  }
  return true
})

onMessage('annotate', ({ data }) => {
  if (activePage.value) {
    const { id, selection, sourceText } = data as {
      id: number
      selection: string
      sourceText: string
    }
    const annotation = addAnnotation(activePage.value.id, id, selection, sourceText, false)
    if (annotation) {
      return annotation
    }
  }
  return null
})

onMessage('add-tag', ({ data }) => {
  if (activePage.value) {
    console.log('add-tag', data)
    const { id, tag } = data as { id: number, tag: string }
    const annotation = addTag(activePage.value.id, id, tag)
    return annotation
  }
  return null
})

onMessage('remove-tag', ({ data }) => {
  if (activePage.value) {
    const { id, tag } = data as { id: number, tag: string }
    const annotation = removeTag(activePage.value.id, id, tag)
    return annotation
  }
  return null
})

onMessage('extract-outline', async ({ data }) => {
  if (activePage.value) {
    let annotation: Annotation | null = null
    const pageId = activePage.value.id

    const { id, sourceText } = data as { id: number, sourceText: string }
    const exampleConcepts = getCurrentConcepts()
      // TODO: better strategy to choose example concepts when there are many
      .slice(0, 200)

    // initialise schema
    updateAnnotation(pageId, id, { schema: newSchema() })

    const instruction = `Extract a hierarchical outline of the following content. Each item should include a unique concept name and a short description. 

You will be provided with a list of existing concepts. If you identify a concept that is the same as one of the given existing concepts, use the existing name. Do not include concepts or information that are irrelevant to the content.

Format the outline in markdown. Use * for bullet points.

Response format:
<outline>
* Fruit: A sweet or savory edible plant product
  * Apple: A type of fruit that is red or green
  * Banana: A type of fruit that is yellow
* Vegetable: A savory edible plant product
</outline>`

    const prompt = `${instruction}\n\nExisting concepts:\n${exampleConcepts}\n\nSource content:\n${sourceText}`

    const response = await chatCompletionText(prompt)

    try {
      // console.log('response', response)
      const match = response.match(/<outline>([\s\S]*?)<\/outline>/)
      const markdown = match ? match[1] : response
      const outline = parseMarkdownToSchema(markdown)
      annotation = updateAnnotation(pageId, id, { schema: outline })
      // console.log('annotation', annotation)
    }
    catch (error) {
      console.error('error', error)
    }

    return annotation
  }
  return null
})

function parseMarkdownToSchema(markdown: string) {
  const lines = markdown.trim().split('\n')
  const stack = [{ name: null as null | string, indent: -1 }]

  const schema: Schema = {
    concepts: [],
  }

  for (const line of lines) {
    const match = line.match(/^(\s*)\* (.*)/)
    if (!match)
      continue

    const indent = match[1].length
    const content = match[2]

    const parts = content.split(':')

    if (parts.length < 2)
      continue

    // const name = parts[0].trim().replace(/\*\*/g, '')
    const name = parts[0].trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
    const description = parts.slice(1).join(':').trim()

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    const item = {
      name,
      description,
      parentName: stack[stack.length - 1].name,
    }

    schema.concepts.push(item)
    stack.push({ name, indent })
  }

  return schema
}

// const markdownText = `
// * **Physical Characteristics**: Distinctive physical features associated with Apert syndrome
// * **Skull and Facial Structure**: Tall skull, high prominent forehead, underdeveloped upper jaw
//   * **Eye and Nose Features**: Prominent eyes, widely spaced apart, bulging eyes, and bulbus nose
// * **Limbs and Fingers**: Fused toes
// * **Developmental Delays**: Slower mental development due to abnormal skull growth
// * **Oral Complications**: Cleft palate
// * **Sensory Related Issues**: Vision problems
// * **Ear and Respiratory Issues**: Recurrent ear infections, hearing loss, difficulty breathing
// * **Gastrointestinal and Dermatological Issues**
// * **Sleep Related**: Increased perspiration while asleep
// * **Skin Related**: Acne, especially during puberty
// `

// console.log(JSON.stringify(parseMarkdownToSchema(markdownText), null, 2))

/** create context menus */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'parent',
    title: 'Annotate',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'highlight',
    parentId: 'parent',
    title: 'Highlight text',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'dehighlight',
    parentId: 'parent',
    title: 'Remove highlight',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'tagging-start',
    parentId: 'parent',
    title: 'Add tags',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'extract-outline',
    parentId: 'parent',
    title: 'Extract outline',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'delete',
    parentId: 'parent',
    title: 'Remove annotation',
    contexts: ['selection'],
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    // "content-script@"+tabs[0].id

    const { menuItemId } = info

    sendMessage(menuItemId.toString(), {}, `content-script@${tab.id}`)
  })
})
