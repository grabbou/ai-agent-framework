import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'
import { getSteps, system } from '../messages.js'
import { assistant, user } from '../messages.js'
import { delegate } from '../state.js'

export const supervisor = (options?: AgentOptions) => {
  return agent({
    run: async (state, context, workflow) => {
      const [workflowRequest, ...messages] = state.messages

      const response = await workflow.team[state.agent].provider.completions({
        messages: [
          system(s`
            You are a planner that breaks down complex workflows into smaller, actionable steps.
            Your job is to determine the next task that needs to be done based on the <workflow> and what has been completed so far.

            Rules:
            1. Each task should be self-contained and achievable
            2. Tasks should be specific and actionable
            3. Return null ONLY after the final output has been generated
            4. Consider dependencies and order of operations
            5. Use context from completed tasks to inform next steps
          `),
          assistant('What is the request?'),
          workflowRequest,
          assistant('What has been completed so far?'),
          ...getSteps(messages),
        ],
        temperature: 0.2,
        response_format: zodResponseFormat(
          z.object({
            task: z
              .string()
              .describe('The next task to be completed or null if the workflow is complete')
              .nullable(),
            reasoning: z
              .string()
              .describe(
                'The reasoning for selecting the next task or why the workflow is complete'
              ),
          }),
          'next_task'
        ),
      })
      try {
        const content = response.choices[0].message.parsed
        if (!content) {
          throw new Error('No content in response')
        }
        console.log(content)
        if (!content.task) {
          return {
            ...state,
            status: 'finished',
          }
        }
        return delegate(state, [['resourcePlanner', user(content.task)]])
      } catch (error) {
        throw new Error('Failed to determine next task')
      }
    },
    ...options,
  })
}
