import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'
import { childState } from '../state.js'

const defaults: AgentOptions = {
  run: async (state, context, workflow) => {
    const response = await workflow.team[state.agent].provider.completions({
      messages: [
        {
          role: 'system',
          content: s`
            You are a planner that breaks down complex workflows into smaller, actionable steps.
            Your job is to determine the next task that needs to be done based on the original workflow and what has been completed so far.
            If all required tasks are completed, return an empty array.

            Rules:
            1. Each task should be self-contained and achievable
            2. Tasks should be specific and actionable
            3. Return null when the workflow is complete
            4. Consider dependencies and order of operations
            5. Use context from completed tasks to inform next steps
            6. If there are tasks that can be run in parallel, return multiple tasks
          `,
        },
        {
          role: 'assistant',
          content: 'What is the request?',
        },
        ...context,
        ...state.messages,
      ],
      temperature: 0.2,
      response_format: zodResponseFormat(
        z.object({
          tasks: z.array(
            z.object({
              task: z.string().describe('The next task to be completed'),
              reasoning: z.string().describe('The reasoning for selecting the next task'),
            })
          ),
        }),
        'next_tasks'
      ),
    })

    try {
      const content = response.choices[0].message.parsed
      if (!content) {
        throw new Error('No content in response')
      }

      if (content.tasks.length === 0) {
        return {
          ...state,
          status: 'finished',
        }
      }

      const requests = content.tasks.map((request) => ({
        role: 'user' as const,
        content: request.task,
      }))

      return {
        ...state,
        status: 'running',
        // tbd: this is wrong and must be udpated
        messages: [...state.messages, ...requests],
        child: requests.map((request) =>
          childState({
            agent: 'resourcePlanner',
            messages: [request],
          })
        ),
      }
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
