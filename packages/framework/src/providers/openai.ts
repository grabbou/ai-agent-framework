import OpenAI, { ClientOptions } from 'openai'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod.js'
import { z, ZodObject } from 'zod'

import { Provider } from '../models.js'

type OpenAIOptions = {
  model?: string
  embeddingsModel?: string
  options?: ClientOptions
}

export const openai = (options: OpenAIOptions = {}): Provider => {
  const {
    model = 'gpt-4o',
    embeddingsModel = 'text-embedding-ada-002',
    options: clientOptions,
  } = options
  const client = new OpenAI(clientOptions)

  return {
    chat: async ({ messages, response_format, temperature, ...options }) => {
      const mappedTools =
        'tools' in options
          ? Object.entries(options.tools).map(([name, tool]) =>
              zodFunction({
                name,
                parameters: tool.parameters,
                description: tool.description,
              })
            )
          : []

      const response = await client.beta.chat.completions.parse({
        model,
        messages,
        tools: mappedTools.length > 0 ? mappedTools : undefined,
        temperature,
        response_format: zodResponseFormat(
          z.object({
            response: objectToDiscriminatedUnion(response_format),
          }),
          Object.keys(response_format).join('_')
        ),
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
    embeddings: async (input: string) => {
      const response = await client.embeddings.create({
        model: embeddingsModel,
        input,
      })
      return response.data[0].embedding
    },
  }
}

const objectToDiscriminatedUnion = (object: Record<string, any>) => {
  const [first, ...rest] = Object.entries(object)
  return z.discriminatedUnion('type', [entryToObject(first), ...rest.map(entryToObject)])
}

const entryToObject = ([key, value]: [string, ZodObject<any>]) => {
  return z.object({ type: z.literal(key), value })
}
