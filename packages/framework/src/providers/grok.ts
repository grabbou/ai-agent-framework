import { Provider } from '../models.js'
import { openai, OpenAIProviderOptions } from './openai_response_functions.js'

/**
 * Required options for the Groq provider.
 *
 * @see OpenAIProviderOptions
 */
type GrokOptions = Partial<OpenAIProviderOptions>

/**
 * Groq provider.
 *
 * Uses OpenAI API, but with custom base URL and API key.
 *
 * Since Grok doesn't support structured outputs, we use tools as response
 * to enforce the right JSON schema.
 *
 * As of now, Grok doesn't support strict mode.
 */
export const grok = (options: GrokOptions = {}): Provider => {
  const { model = 'grok-beta', embeddingsModel = 'v1', options: clientOptions } = options
  return openai({
    model,
    embeddingsModel,
    strictMode: false,
    options: {
      apiKey: process.env.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1',
      ...clientOptions,
    },
  })
}
