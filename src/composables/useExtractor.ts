import type { EgoNetworkInput, Input, Output } from '@/types/extractor'
import { chatCompletion } from '@/services/llm'
import { SchemaType } from '@/types/extractor'
import { useBrowserLocalStorage } from './useBrowserStorage'

export function useExtractor() {
  /** define state */
  const { data: modal } = useBrowserLocalStorage('extractor-modal', false)
  const { data: input } = useBrowserLocalStorage('extractor-input', { schemaType: SchemaType.Network, sourceText: '' } as Input)
  const { data: output } = useBrowserLocalStorage('extractor-output', null as Output | null)

  const { data: clippingModal } = useBrowserLocalStorage('clipping-web', false)

  const state = {
    modal,
    input,
    output,
    clippingModal,
  }

  /** actions */

  function openModal() {
    modal.value = true
    console.info('modal', modal.value)
  }

  function enableClipping() {
    clippingModal.value = true
  }

  function disableClipping() {
    clippingModal.value = false
  }

  function toggleClipping() {
    clippingModal.value = !clippingModal.value
  }

  function setInput(data: Input) {
    input.value = data
    console.info('input', input.value)
  }

  function extractEgoNetwork(callback: (output: Output) => void = () => {}) {
    console.info('extracting', input.value)

    if (input.value.schemaType !== SchemaType.EgoNetwork) {
      return
    }

    const enInput = input.value as EgoNetworkInput

    const instruction = `Extract the concepts that are directly connected to the given central concept. Classify the relationships into categories.
    
Supposing the given central concept is 'A', the extracted concepts are 'B', 'C', ...

The return format should be:

{
  nodes: [
    { name: 'B' },
    { name: 'C' },
    // other concepts
  ],
  links: [
    { source: 'A', target: 'B', category: 'relationship1' },
    { source: 'A', target: 'C', category: 'relationship2' },
    // other relationships
  ]
}`
    const prompt = `${instruction}
    
Central concept: ${enInput.centralConcept}

Source information: ${enInput.sourceText}`

    chatCompletion(prompt, (response) => {
      try {
        output.value = {
          schema: JSON.parse(response),
        }
        callback(output.value)
        console.info('output', output.value)
      }
      catch (error) {
        console.error('error', error)
        console.error('response', response)
      }
    })
  }

  function extractNetwork(callback: (output: Output) => void = () => {}) {
    console.info('extracting', input.value)

    const instruction = `Extract main concepts and their relations mentioned in the source information. Make sure the generated concept network is well-structured and easy to understand. Please classify the relationships into categories.

Return format: {
  nodes: [
    { name: 'concept1' },
    // other concepts
  ],
  links: [
    { source: 'concept1', target: 'concept2', category: 'relationship1' },
    // other relationships
  ]
}

Node names should be unique.`

    const prompt = `${instruction}

Source information: ${input.value.sourceText}`

    chatCompletion(prompt, (response) => {
      try {
        output.value = {
          schema: JSON.parse(response),
        }
        callback(output.value)
        console.info('output', output.value)
      }
      catch (error) {
        console.error('error', error)
        console.error('response', response)
      }
    })
  }

  return {
    ...state,
    openModal,
    enableClipping,
    toggleClipping,
    setInput,
    extractNetwork,
    extractEgoNetwork,
  }
}
