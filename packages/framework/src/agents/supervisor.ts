import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'
import { getSteps } from '../messages.js'
import { delegate, request, response } from '../state.js'

const defaults: AgentOptions = {
  run: async (state, context, workflow) => {
    const [workflowRequest, ...messages] = state.messages

    const res = await workflow.team[state.agent].provider.completions({
      messages: [
        {
          role: 'system',
          content: s`
            You are a planner that breaks down complex workflows into smaller, actionable steps.
            Your job is to determine the next task that needs to be done based on the <workflow> and what has been completed so far.

            You can run tasks in parallel, if they do not depend on each other. Otherwise, run them sequentially.

            Rules:
            1. Each task should be self-contained and achievable
            2. Tasks should be specific and actionable
            3. Return null when the workflow is complete
            4. Consider dependencies and order of operations
            5. Use context from completed tasks to inform next steps
          `,
        },
        response('What is the request?'),
        workflowRequest,
        response('What has been completed so far?'),
        ...getSteps(messages),
      ],
      temperature: 0.2,
      response_format: zodResponseFormat(
        z.object({
          tasks: z
            .array(
              z.object({
                task: z.string().describe('The next task to be completed'),
                reasoning: z.string().describe('The reasoning for selecting the next task'),
              })
            )
            .describe('Next tasks, or empty array if the workflow is complete'),
        }),
        'next_tasks'
      ),
    })

    try {
      const content = res.choices[0].message.parsed
      if (!content) {
        throw new Error('No content in response')
      }

      if (content.tasks.length === 0) {
        return {
          ...state,
          status: 'finished',
        }
      }

      return delegate(
        state,
        content.tasks.map((item) => ['resourcePlanner', request(item.task)])
      )
    } catch (error) {
      throw new Error('Failed to determine next task')
    }
  },
}

export const supervisor = (options?: AgentOptions) =>
  agent({
    ...defaults,
    ...options,
  })
