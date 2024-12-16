import s from 'dedent'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'
import { getSteps, system } from '../messages.js'
import { assistant, user } from '../messages.js'
import { delegate } from '../state.js'

export const supervisor = (options?: AgentOptions) => {
  return agent({
    run: async (provider, state) => {
      const [workflowRequest, ...messages] = state.messages

      const response = await provider.chat({
        messages: [
          system(s`
            You are a planner that breaks down complex workflows into smaller, actionable steps.
            Your job is to determine the next task that needs to be done based on the <workflow> and what has been completed so far.
            
            Rules:
            1. Each task should be self-contained and achievable
            2. Tasks should be specific and actionable
            3. Return null when the workflow is complete
            4. Consider dependencies and order of operations
            5. Use context from completed tasks to inform next steps
          `),
          assistant('What is the request?'),
          workflowRequest,
          ...(messages.length > 0
            ? [assistant('What has been completed so far?'), ...getSteps(messages)]
            : []),
        ],
        temperature: 0.2,
        response_format: {
          next_task: z.object({
            task: z
              .string()
              .describe('The next task to be completed, or empty string if workflow is complete'),
            reasoning: z
              .string()
              .describe(
                'The reasoning for selecting the next task or why the workflow is complete'
              ),
          }),
        },
      })
      try {
        if (!response.value.task) {
          return {
            ...state,
            status: 'finished',
          }
        }
        return delegate(state, [['resourcePlanner', user(response.value.task)]])
      } catch (error) {
        throw new Error('Failed to determine next task')
      }
    },
    ...options,
  })
}
