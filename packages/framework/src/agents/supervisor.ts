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
          assistant('What has been completed so far?'),
          ...getSteps(messages),
        ],
        temperature: 0.2,
        response_format: {
          next_task: z.object({
            task: z.string().describe('The next task to be completed'),
            reasoning: z.string().describe('The reasoning for selecting the next task'),
          }),
          final_answer: z.object({
            answer: z.string().describe('The final answer to the user request'),
            reasoning: z.string().describe('The reasoning why workflow is complete'),
          }),
        },
      })
      try {
        if (response.type === 'final_answer') {
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
