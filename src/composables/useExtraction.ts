import { Input, Output, SchemaType } from '@/types/extraction'
import { useBrowserLocalStorage } from './useBrowserStorage'
import { chatCompletion } from '@/services/llm'

export function useExtraction() {
  /** define state */
  const { data: input } = useBrowserLocalStorage('extraction-input', { schemaType: SchemaType.Network, sourceText: '' } as Input)
  const { data: output } = useBrowserLocalStorage('extraction-output', null as Output | null)

  /** actions */

  function setInput(data: Partial<Input>) {
    input.value = { ...input.value, ...data }
  }

  function extractNetwork() {
    console.info('extracting', input.value)

    const instruction = `Extract a concept network from the source information. Focus on the main concepts and their relationships. Please classify the relationships into categories.
    
Return format: {
  nodes: [
    { name: 'concept1' },
    ...
  ],
  links: [
    { source: 'concept1', target: 'concept2', category: 'relationship1' },
    ...
  ]
}

Node names should be unique.`

    const prompt = `${instruction}

Source information: ${input.value.sourceText}`

    chatCompletion(prompt, (response) => {
      console.info('response', response)
      output.value = {
        schema: JSON.parse(response),
      }
      console.info('output', output.value)
    })
  }

  return {
    input,
    setInput,
    extractNetwork,
  }
}
