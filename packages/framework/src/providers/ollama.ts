// import { randomUUID } from 'node:crypto'

// import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
// import { z, ZodObject } from 'zod'

// import { user } from '../messages.js'
// import { Provider } from '../models.js'

// type OllamaOptions = {
//   model: string
//   baseUrl?: string
// }

// const ResponseSchema = z.object({
//   model: z.string(),
//   created_at: z.string(),
//   message: z.object({
//     role: z.literal('assistant'),
//     content: z.string(),
//     tool_calls: z
//       .array(
//         z.object({
//           function: z.object({
//             name: z.string(),
//             arguments: z.record(z.string(), z.any()),
//           }),
//         })
//       )
//       .optional(),
//   }),
//   done_reason: z.string(),
//   done: z.boolean(),
//   total_duration: z.number(),
//   load_duration: z.number(),
//   prompt_eval_count: z.number(),
//   prompt_eval_duration: z.number(),
//   eval_count: z.number(),
//   eval_duration: z.number(),
// })

// export const ollama = (options: OllamaOptions): Provider => {
//   const { model, baseUrl = 'http://localhost:11434' } = options

//   return {
//     chat: async ({ name, messages, response_format: response_format, temperature }) => {
//       const response = await fetch(`${baseUrl}/api/chat`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model,
//           messages,
//           format: zodResponseFormat(response_format, name).json_schema.schema,
//           temperature,
//           stream: false,
//         }),
//       })

//       const modelResponse = await response.json()
//       if (modelResponse.error) {
//         throw new Error(modelResponse.error)
//       }

//       const { content } = ResponseSchema.parse(modelResponse).message
//       const parsed = response_format.parse(JSON.parse(content))

//       return {
//         role: 'assistant',
//         content,
//         // tool_calls:
//         //   tool_calls?.map((toolCall) => ({
//         //     id: randomUUID(),
//         //     type: 'function',
//         //     function: {
//         //       name: toolCall.function.name,
//         //       arguments: JSON.stringify(toolCall.function.arguments),
//         //       parsed_arguments: toolCall.function.arguments,
//         //     },
//         //   })) || [],
//         tool_calls: [],
//         refusal: null,
//         parsed,
//       }
//     },
//     embeddings: async (input: string) => {
//       const response = await fetch(`${baseUrl}/api/embeddings`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model,
//           prompt: input,
//         }),
//       }).then((r) => r.json())

//       return response.embedding
//     },
//   }
// }
