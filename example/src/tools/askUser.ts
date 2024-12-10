import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

async function requestUserInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    console.log('❔' + prompt)
    process.stdin.resume()
    process.stdin.once('data', (data) => {
      process.stdin.pause()
      resolve(data.toString().trim())
    })
  })
}

export const askUser = tool({
  description: 'Tool for asking patient a question',
  parameters: z.object({
    query: z.string().describe('The question to ask the patient'),
  }),
  execute: ({ query }): Promise<string> => {
    return requestUserInput(query)
  },
})
