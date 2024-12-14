import { randomUUID } from 'node:crypto'

import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { Provider } from '../models.js'

type OllamaOptions = {
  model: string
  baseUrl?: string
}

const ResponseSchema = z.object({
  model: z.string(),
  created_at: z.string(),
  message: z.object({
    role: z.literal('assistant'),
    content: z.string(),
    tool_calls: z
      .array(
        z.object({
          function: z.object({
            name: z.string(),
            arguments: z.record(z.string(), z.any()),
          }),
        })
      )
      .optional(),
  }),
  done_reason: z.string(),
  done: z.boolean(),
  total_duration: z.number(),
  load_duration: z.number(),
  prompt_eval_count: z.number(),
  prompt_eval_duration: z.number(),
  eval_count: z.number(),
  eval_duration: z.number(),
})

export const ollama = (options: OllamaOptions): Provider => {
  const { model, baseUrl = 'http://localhost:11434' } = options

  return {
    chat: async ({ name, messages, tools = {}, response_format, temperature }) => {
      const mappedTools = tools
        ? Object.entries(tools).map(([name, tool]) =>
            zodFunction({
              name,
              parameters: tool.parameters,
              description: tool.description,
            })
          )
        : []

      const jsonSchema = zodResponseFormat(response_format, name).json_schema

      console.log(mappedTools)

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          tools: mappedTools,
          temperature,
          format: jsonSchema.schema,
          stream: false,
        }),
      })

      const message = ResponseSchema.parse(await response.json()).message
      const parsed = response_format.parse(JSON.parse(message.content))

      return {
        role: 'assistant',
        content: message.content,
        tool_calls:
          message.tool_calls?.map((toolCall) => ({
            id: randomUUID(),
            type: 'function',
            function: {
              name: toolCall.function.name,
              arguments: JSON.stringify(toolCall.function.arguments),
              parsed_arguments: toolCall.function.arguments,
            },
          })) || [],
        refusal: null,
        parsed,
      }
    },

    embeddings: async (input: string) => {
      const response = await fetch(`${baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: input,
        }),
      }).then((r) => r.json())

      return response.embedding
    },
  }
}
