import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

import { Provider } from '../models.js'
import { Message } from '../types.js'

export async function finalizeWorkflow(provider: Provider, messages: Message[]): Promise<string> {
  const response = await provider.completions({
    messages: [
      {
        role: 'system',
        content: s`
          You exceeded max steps.
          Please summarize all executed steps and do your best to achieve 
          the main goal while responding with the final answer
        `,
      },
      ...messages,
    ],
    response_format: zodResponseFormat(
      z.object({
        finalAnswer: z.string().describe('The final result of the task'),
      }),
      'task_result'
    ),
  })
  const result = response.choices[0].message.parsed
  if (!result) {
    throw new Error('No parsed response received')
  }
  return result.finalAnswer
}
