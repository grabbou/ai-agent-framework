import { randomUUID } from 'node:crypto'

import OpenAI from 'openai'

import { Provider, responseAsToolCall, toLLMTools } from '../models.js'
import { OpenAIProviderOptions as BaseOpenAIProviderOptions } from './openai.js'

/**
 * Required options for the OpenAI-compatible provider.
 */
export type OpenAIProviderOptions = BaseOpenAIProviderOptions &
  /**
   * Since this is meant to be used with OpenAI-compatible providers,
   * we do not provide any defaults.
   */
  Required<Pick<BaseOpenAIProviderOptions, 'model' | 'embeddingsModel' | 'options'>> & {
    /**
     * Whether to use strict mode.
     * @default false
     */
    strictMode?: boolean
  }

/**
 * OpenAI provider.
 *
 * Unlike `openai.js`, this provider does not use response_format / structured output,
 * but tools as response to enforce the right JSON schema.
 */
export const openai = (options: OpenAIProviderOptions): Provider => {
  const { model, embeddingsModel, options: clientOptions, strictMode = false, body = {} } = options
  const client = new OpenAI(clientOptions)

  return {
    chat: async ({ messages, response_format, temperature, ...options }) => {
      const tools = 'tools' in options ? toLLMTools(options.tools, strictMode) : []

      const response = await client.chat.completions.create({
        model,
        tools: [...tools, ...responseAsToolCall(response_format, strictMode)],
        messages,
        temperature,
        tool_choice: 'required',
        ...body,
      })

      /**
       * Tool choice is required. If tools are missing in the response,
       * we throw an error.
       */
      const message = response.choices[0].message
      if (!message.tool_calls) {
        throw new Error('No response in message')
      }

      /**
       * If LLM wants to call a tool that is a response, we return that response.
       */
      const firstToolCall = message.tool_calls[0]
      if (Object.keys(response_format).includes(firstToolCall.function.name)) {
        /**
         * Just in case LLM called multiple tools, including response as tool,
         * we throw an error.
         */
        if (message.tool_calls.length > 1) {
          throw new Error(
            `When calling one of ${Object.keys(response_format).join(', ')}, you cannot call other tools.`
          )
        }
        const schema = response_format[firstToolCall.function.name]
        return {
          type: firstToolCall.function.name,
          value: schema.parse(JSON.parse(firstToolCall.function.arguments)),
        }
      }

      return {
        type: 'tool_call',
        value: message.tool_calls.map((tollCall) => ({
          ...tollCall,
          /**
           * Some providers, such as Groq, return unique IDs within the current
           * request. We generate a random UUID to ensure that the tool call ID
           * is unique throughout the entire session.
           */
          id: randomUUID(),
          function: {
            ...tollCall.function,
            /**
             * Internally, we rely on OpenAI built-in support for Zod schemas,
             * via `parsed_arguments` field.
             */
            parsed_arguments: JSON.parse(tollCall.function.arguments),
          },
        })),
      }
    },
    embeddings: async (input: string) => {
      const response = await client.embeddings.create({
        model: embeddingsModel,
        input,
      })
      return response.data[0].embedding
    },
  }
}
