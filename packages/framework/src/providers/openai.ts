import OpenAI, { ClientOptions } from 'openai'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod.js'

import { Provider } from '../models.js'

type OpenAIOptions = {
  model?: string
  embeddingsModel?: string
  options?: ClientOptions
}

export const openai = (options: OpenAIOptions = {}): Provider => {
  const {
    model = 'gpt-4',
    embeddingsModel = 'text-embedding-ada-002',
    options: clientOptions,
  } = options
  const client = new OpenAI(clientOptions)

  return {
    completions: async ({ name, messages, tools = {}, response_format, temperature }) => {
      const mappedTools = tools
        ? Object.entries(tools).map(([name, tool]) =>
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
        response_format: zodResponseFormat(response_format, name),
      })

      return response.choices[0].message
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
