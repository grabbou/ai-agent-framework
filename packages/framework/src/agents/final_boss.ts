import s from 'dedent'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'
import { assistant } from '../messages.js'
import { user } from '../messages.js'
import { finish } from '../state.js'

const defaults: AgentOptions = {
  run: async (provider, state, context) => {
    const response = await provider.chat({
      messages: [
        {
          role: 'system',
          content: s`
            You exceeded max steps.
          `,
        },
        ...context,
        user(s`
          Please summarize all executed steps and do your best to achieve 
          the main goal while responding with the final answer
        `),
      ],
      response_format: z.object({
        finalAnswer: z.string().describe('The final result of the task'),
      }),
      name: 'task_result',
    })
    const message = response.parsed
    if (!message) {
      throw new Error('No parsed response received')
    }
    return finish(state, assistant(message.finalAnswer))
  },
}

export const finalBoss = (options?: AgentOptions) =>
  agent({
    ...defaults,
    ...options,
  })
