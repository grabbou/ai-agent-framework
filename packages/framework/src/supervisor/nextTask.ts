import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

import { Model } from '../models/openai.js'
import { Message } from '../types.js'

export async function getNextTask(model: Model, history: Message[]): Promise<string | null> {
  const response = await model.completions({
    model: model.name,
    messages: [
      {
        role: 'system',
        // tbd: handle subsequent failures
        content: s`
          You are a planner that breaks down complex workflows into smaller, actionable steps.
          Your job is to determine the next task that needs to be done based on the original workflow and what has been completed so far.
          If all required tasks are completed, return null.

          Rules:
          1. Each task should be self-contained and achievable
          2. Tasks should be specific and actionable
          3. Return null when the workflow is complete
          4. Consider dependencies and order of operations
          5. Use context from completed tasks to inform next steps
        `,
      },
      ...history,
      {
        role: 'user',
        content: 'What is the next task that needs to be done?',
      },
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
          .describe('The reasoning for selecting the next task or why the workflow is complete'),
      }),
      'next_task'
    ),
  })

  try {
    const content = response.choices[0].message.parsed
    if (!content) {
      throw new Error('No content in response')
    }

    if (!content.task) {
      return null
    }

    return content.task
  } catch (error) {
    throw new Error('Failed to determine next task')
  }
}
