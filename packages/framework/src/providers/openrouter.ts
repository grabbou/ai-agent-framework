import { Provider } from '../models.js'
import { openai, OpenAIProviderOptions } from './openai.js'

/**
 * Required options for the OpenRouter provider.
 *
 * @see OpenAIProviderOptions
 */
type OpenRouterOptions = Partial<OpenAIProviderOptions>

/**
 * OpenRouter provider.
 *
 * Uses OpenAI API, but with custom base URL and API key.
 */
export const openrouter = (options: OpenRouterOptions = {}): Provider => {
  const {
    model = 'meta-llama/llama-3.1-405b-instruct',
    embeddingsModel = 'tbd',
    options: clientOptions,
    body = {},
  } = options
  return openai({
    model,
    embeddingsModel,
    options: {
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      ...clientOptions,
    },
    /**
     * Force OpenRouter to load-balance requests across providers that
     * support structured output.
     */
    body: {
      provider: {
        /**
         * @see https://openrouter.ai/docs/provider-routing#required-parameters-_beta_
         */
        require_parameters: true,
      },
      ...body,
    },
  })
}
