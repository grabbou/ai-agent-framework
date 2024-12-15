import OpenAI, { ClientOptions as OpenAIOptions } from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod.js'
import { z, ZodObject } from 'zod'

import { Provider, toLLMTools } from '../models.js'

export type OpenAIProviderOptions = {
  model?: string
  embeddingsModel?: string
  options?: OpenAIOptions
}

export const openai = (options: OpenAIProviderOptions = {}): Provider => {
  const {
    model = 'gpt-4o',
    embeddingsModel = 'text-embedding-ada-002',
    options: clientOptions,
  } = options
  const client = new OpenAI(clientOptions)

  return {
    chat: async ({ messages, response_format, temperature, ...options }) => {
      const mappedTools = 'tools' in options ? toLLMTools(options.tools) : []

      const response = await client.beta.chat.completions.parse({
        model,
        messages,
        tools: mappedTools.length > 0 ? mappedTools : undefined,
        temperature,
        response_format: zodResponseFormat(
          z.object({
            response: objectToDiscriminatedUnion(response_format),
          }),
          'task_result'
        ),
      })

      const message = response.choices[0].message

      if (message.tool_calls.length > 0) {
        return {
          kind: 'tool_call',
          value: message.tool_calls,
        }
      }

      if (!message.parsed?.response) {
        throw new Error('No response in message')
      }

      return message.parsed.response
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

/**
 * Converts an object such as
 * ```
 * { a: z.object({ b: z.string() }) }
 * ```
 * to a discriminated union such as
 * ```
 * z.discriminatedUnion('type', [
 *   z.object({ type: z.literal('a'), value: z.object({ b: z.string() }) }),
 * ])
 * ```
 * to be used as a response format for OpenAI.
 */
const objectToDiscriminatedUnion = (object: Record<string, any>) => {
  const [first, ...rest] = Object.entries(object)
  return z.discriminatedUnion('kind', [entryToObject(first), ...rest.map(entryToObject)])
}

const entryToObject = ([key, value]: [string, ZodObject<any>]) => {
  return z.object({ kind: z.literal(key), value })
}
