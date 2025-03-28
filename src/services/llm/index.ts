import { useLocale } from '@/composables/useLocale'

const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'
const API_KEY = import.meta.env.VITE_SF_API_KEY

export async function chatCompletion(
  message: string,
  onResponse: (response: any) => void = () => {},
  maxRetries: number = 3,
) {
  const options = getOptions(message)
  try {
    // console.info('fetching', message)
    fetch(API_URL, options)
      .then(response => response.json())
      .then((result) => {
        const content = result.choices[0].message.content
        onResponse(content)
      })
  }
  catch (error) {
    console.error('Error:', error, `retrying...${maxRetries}times left`)
    if (maxRetries > 0) {
      chatCompletion(message, onResponse, maxRetries - 1)
    }
  }
}

export async function chatCompletionText(
  message: string,
  maxRetries: number = 3,
): Promise<string> {
  const options = getOptions(message, 'text')

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.info('fetching', message)
      const response = await fetch(API_URL, options)
      const result = await response.json()
      return result.choices[0].message.content
    }
    catch (error) {
      console.error('Error:', error, `retrying... ${maxRetries - attempt} times left`)
      if (attempt === maxRetries) {
        throw new Error('Max retries reached')
      }
    }
  }

  throw new Error('Unexpected error in chatCompletionText')
}

function getOptions(
  message: string,
  response_format: 'json_object' | 'text' = 'json_object',
) {
  const locale = useLocale()
  const model = locale.value === 'zh' ? 'deepseek-ai/DeepSeek-V3' : 'meta-llama/Meta-Llama-3.1-8B-Instruct'
  return {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      // model,
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct', // 'Qwen/Qwen2-7B-Instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: message,
            },
          ],
        },
      ],
      stream: false,
      max_tokens: 4096,
      stop: ['null'],
      response_format: {
        // type: 'json_object',
        type: response_format,
      },
    }),
  }
}
