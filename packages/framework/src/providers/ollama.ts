import { Provider } from '../models.js'
import { OpenAIOptions } from './openai.js'
import { openai } from './openai_functions.js'

export const ollama = (options: OpenAIOptions = {}): Provider => {
  const { model = 'llama3.1', options: clientOptions } = options
  return openai({
    model,
    options: {
      baseURL: 'http://localhost:11434/v1',
      ...clientOptions,
    },
  })
}
