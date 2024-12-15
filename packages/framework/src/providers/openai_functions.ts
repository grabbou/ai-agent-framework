import { randomUUID } from 'node:crypto'

import s from 'dedent'
import OpenAI from 'openai'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { Provider, toLLMTools } from '../models.js'
import { OpenAIOptions } from './openai.js'

export const openai = (options: OpenAIOptions = {}): Provider => {
  const {
    model = 'gpt-4o',
    embeddingsModel = 'text-embedding-ada-002',
    options: clientOptions,
  } = options
  const client = new OpenAI(clientOptions)

  return {
    chat: async ({ messages, response_format, temperature, ...options }) => {
      const tools = 'tools' in options ? toLLMTools(options.tools, false) : []

      tools.push(
        ...Object.entries(response_format).map(([name, schema]) => ({
          type: 'function' as const,
          function: {
            name,
            parameters: zodToJsonSchema(schema),
            description: s`
              Call this function when you are done processing user request
              and want to return "${name}" as the result.
            `,
            strict: false,
          },
        }))
      )

      const response = await client.chat.completions.create({
        model,
        tools,
        messages,
        temperature,
        tool_choice: 'required',
      })

      const message = response.choices[0].message
      if (!message.tool_calls) {
        throw new Error('No response in message')
      }

      if (Object.keys(response_format).includes(message.tool_calls[0].function.name)) {
        const schema = response_format[message.tool_calls[0].function.name]
        return {
          type: message.tool_calls[0].function.name,
          value: schema.parse(JSON.parse(message.tool_calls[0].function.arguments)),
        }
      }

      return {
        type: 'tool_call',
        value: message.tool_calls.map((tollCall) => ({
          ...tollCall,
          id: randomUUID(),
          function: {
            ...tollCall.function,
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
