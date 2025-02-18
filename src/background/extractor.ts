import type { Input } from '@/types/extraction'
import { onMessage, sendMessage } from 'webext-bridge/background'
import { useExtraction } from '@/composables/useExtraction'

const { setInput, extractNetwork } = useExtraction()

async function extract({ data }: {
  data: Input
}) {
  setInput(data)
  extractNetwork()
}

export function initialiseExtractor() {
  onMessage('extract', extract)
}
