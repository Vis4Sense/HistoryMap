const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'
const API_KEY = import.meta.env.VITE_SF_API_KEY

export async function chatCompletion(
  message: string,
  onResponse: (response: any) => void = () => {},
  maxRetries: number = 3,
) {
  const options = getOptions(message)
  try {
    fetch(API_URL, options)
      .then(response => response.json())
      .then(result => {
        const content = result.choices[0].message.content
        onResponse(content)
      })
  } catch (error) {
    console.error('Error:', error, `retrying...${maxRetries}times left`)
    if (maxRetries > 0) {
      chatCompletion(message, onResponse, maxRetries - 1)
    }
  }
}

function getOptions(message: string) {
  return {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
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
        type: 'json_object',
      },
    }),
  }
}
