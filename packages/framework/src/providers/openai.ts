import OpenAI, { ClientOptions as OpenAIOptions } from 'openai'

import { Provider, responseAsStructuredOutput, toLLMTools } from '../models.js'

export type OpenAIProviderOptions = {
  /**
   * Model to use.
   */
  model?: string
  options?: OpenAIOptions
  /**
   * Additional body parameters.
   */
  body?: Record<string, any>
}

/**
 * OpenAI provider.
 *
 * This provider uses response_format / structured output, together with tools.
 *
 * When using this provider with other LLMs, make sure they support both tools and structured_output,
 * otherwise you will get an error. Otherwise, use the one from `openai_response_functions.js` instead.
 */
export const openai = (options: OpenAIProviderOptions = {}): Provider => {
  const { model = 'gpt-4o', options: clientOptions } = options
  const client = new OpenAI(clientOptions)

  return {
    chat: async ({ messages, response_format, temperature, ...options }) => {
      const mappedTools = 'tools' in options ? toLLMTools(options.tools) : []

      const response = await client.beta.chat.completions.parse({
        model,
        messages,
        tools: mappedTools.length > 0 ? mappedTools : undefined,
        temperature,
        response_format: responseAsStructuredOutput(response_format),
        ...body,
      })

      const message = response.choices[0].message
      if (message.tool_calls.length > 0) {
        return {
          type: 'tool_call',
          value: message.tool_calls,
        }
      }

      if (!message.parsed?.response) {
        throw new Error('No response in message')
      }

      return message.parsed.response
    },
  }
}
