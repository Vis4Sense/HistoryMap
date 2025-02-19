import { Input, Output, SchemaType } from '@/types/extraction'
import { useBrowserLocalStorage } from './useBrowserStorage'
import { chatCompletion } from '@/services/llm'

export function useExtractor() {
  /** define state */
  const { data: input } = useBrowserLocalStorage('extraction-input', { schemaType: SchemaType.Network, sourceText: '' } as Input)
  const { data: output } = useBrowserLocalStorage('extraction-output', null as Output | null)

  const state = {
    input,
    output,
  }

  /** actions */

  function setInput(data: Partial<Input>) {
    input.value = { ...input.value, ...data }
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
      } catch (error) {
        console.error('error', error)
        console.error('response', response)
      }
    })
  }

  return {
    ...state,
    setInput,
    extractNetwork,
  }
}
