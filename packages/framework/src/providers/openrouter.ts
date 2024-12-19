import { Provider } from '../models.js'
import { openai as openai_structured_output, OpenAIProviderOptions } from './openai.js'
import { openai as openai_response_functions } from './openai_response_functions.js'

/**
 * Required options for the OpenRouter provider.
 *
 * @see OpenAIProviderOptions
 */
type OpenRouterOptions = Partial<OpenAIProviderOptions> & {
  /**
   * Certain providers, such as Anthropic, do not support structured output.
   * In this case, we use response functions instead.
   */
  structured_output?: boolean
}

/**
 * OpenRouter provider.
 *
 * Uses OpenAI API, but with custom base URL and API key.
 */
export const openrouter = (options: OpenRouterOptions = {}): Provider => {
  const {
    model = 'meta-llama/llama-3.1-405b-instruct',
    structured_output = true,
    options: clientOptions,
    body = {},
  } = options
  const openAiOptions = {
    model,
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
      ...body,
      provider: {
        /**
         * @see https://openrouter.ai/docs/provider-routing#required-parameters-_beta_
         */
        require_parameters: true,
        ...body?.provider,
      },
    },
  }
  if (structured_output) {
    return openai_structured_output(openAiOptions)
  } else {
    return openai_response_functions(openAiOptions)
  }
}
