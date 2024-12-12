import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'
import { childState } from '../state.js'

const groupMessagePairs = <T>(messages: T[]): T[][] => {
  return messages.reduce((pairs: T[][], message: T, index: number) => {
    if (index % 2 === 0) {
      pairs.push([message])
    } else {
      // Add to the last pair
      pairs[pairs.length - 1].push(message)
    }
    return pairs
  }, [])
}

const defaults: AgentOptions = {
  run: async (state, context, workflow) => {
    const [request, ...messages] = state.messages
    const steps = groupMessagePairs(messages)

    const response = await workflow.team[state.agent].provider.completions({
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
        {
          role: 'assistant',
          content: 'What is the request?',
        },
        request,
        {
          role: 'assistant',
          content: 'What has been completed so far?',
        },
        ...steps.map(([task, result]) => ({
          role: 'user' as const,
          content: s`
            Step name: ${task.content}
            Step result: ${result.content}
          `,
        })),
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
