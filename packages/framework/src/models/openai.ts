import OpenAI, { ClientOptions } from 'openai'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod.js'

import { Provider } from './base.js'

type OpenAIOptions = {
  model?: string
  options?: ClientOptions
}

export const openai = (options: OpenAIOptions = {}): Provider => {
  const { model = 'gpt-4', options: clientOptions } = options
  const client = new OpenAI(clientOptions)

  return {
    completions: async ({ name, messages, tools = {}, response_format }) => {
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
        response_format: zodResponseFormat(response_format, name),
      })

      return response.choices[0].message
    },
  }
}
