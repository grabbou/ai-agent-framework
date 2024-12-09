import s from 'dedent'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { Agent } from '../agent.js'
import { Message } from '../types.js'

export async function runAgent(
  agent: Agent,
  agentRequest: Message[]
): Promise<[Message[], 'step' | 'complete' | 'tool']> {
  const tools = agent.tools
    ? Object.entries(agent.tools).map(([name, tool]) =>
        zodFunction({
          name,
          parameters: tool.parameters,
          description: tool.description,
        })
      )
    : []

  const response = await agent.provider.completions({
    messages: [
      {
        role: 'system',
        content: s`
          You are ${agent.role}. ${agent.description}
          
          Your job is to complete the assigned task.
          1. You can break down complex task into multiple steps
          2. You can use available tools when needed

          First try to complete the task on your own.
          Only ask question to the user if you cannot complete the task without their input.
        `,
      },
      ...agentRequest,
    ],
    tools: tools.length > 0 ? tools : undefined,
    response_format: zodResponseFormat(
      z.object({
        response: z.discriminatedUnion('kind', [
          z.object({
            kind: z.literal('step'),
            name: z.string().describe('The name of the step'),
            result: z.string().describe('The result of the step'),
            reasoning: z.string().describe('The reasoning for this step'),
          }),
          z.object({
            kind: z.literal('complete'),
            result: z.string().describe('The final result of the task'),
            reasoning: z.string().describe('The reasoning for completing the task'),
          }),
        ]),
      }),
      'task_result'
    ),
  })

  if (response.choices[0].message.tool_calls.length > 0) {
    return [[response.choices[0].message], 'tool']
  }

  const result = response.choices[0].message.parsed
  if (!result) {
    throw new Error('No parsed response received')
  }

  return [
    [
      {
        role: 'assistant',
        content: result.response.result,
      },
    ],
    result.response.kind,
  ]
}
