import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'

const defaults: AgentOptions = {
  run: async (state, context, team) => {
    const response = await team[state.agent].provider.completions({
      messages: [
        {
          role: 'system',
          content: s`
            You exceeded max steps.
          `,
        },
        ...context,
        {
          role: 'user',
          content: s`
            Please summarize all executed steps and do your best to achieve 
            the main goal while responding with the final answer
          `,
        },
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
    return {
      ...state,
      status: 'finished',
      messages: [...state.messages, { role: 'assistant', content: result.finalAnswer }],
    }
  },
}

export const finalBoss = (options?: AgentOptions) =>
  agent({
    ...defaults,
    ...options,
  })
