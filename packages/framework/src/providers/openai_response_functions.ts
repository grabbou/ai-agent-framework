import { randomUUID } from 'node:crypto'

import OpenAI from 'openai'

import { Provider, responseToToolCalls, toLLMTools } from '../models.js'
import { OpenAIProviderOptions } from './openai.js'

export const openai = (options: OpenAIProviderOptions = {}): Provider => {
  const {
    model = 'gpt-4o',
    embeddingsModel = 'text-embedding-ada-002',
    options: clientOptions,
  } = options
  const client = new OpenAI(clientOptions)

  return {
    chat: async ({ messages, response_format, temperature, ...options }) => {
      const tools = 'tools' in options ? toLLMTools(options.tools, false) : []

      tools.push(...responseToToolCalls(response_format))

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
