import { Provider } from '../models.js'
import { OpenAIOptions } from './openai.js'
import { openai } from './openai_functions.js'

export const grok = (options: OpenAIOptions = {}): Provider => {
  const { model = 'grok-beta', embeddingsModel = 'v1', options: clientOptions } = options
  return openai({
    model,
    embeddingsModel,
    options: {
      apiKey: process.env.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1',
      ...clientOptions,
    },
  })
}
