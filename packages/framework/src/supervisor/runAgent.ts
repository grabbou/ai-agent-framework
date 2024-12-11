import s from 'dedent'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { Agent } from '../agent.js'
import { Message } from '../types.js'

export async function runAgent(
  agent: Agent,
  agentContext: Message[],
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

          Your job is to complete the assigned task:
          - You can break down complex tasks into multiple steps if needed.
          - You can use available tools if needed.

          If tool requires arguments, get them from the input, or use other tools to get them.
          Do not fabricate or assume information not present in the input.

          Try to complete the task on your own.
        `,
      },
      {
        role: 'assistant',
        content: 'What have been done so far?',
      },
      {
        role: 'user',
        content: `Here is all the work done so far by other agents: ${JSON.stringify(agentContext)}`,
      },
      {
        role: 'assistant',
        content: 'What do you want me to do now?',
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
            nextStep: z
              .string()
              .nullable()
              .describe('The next step to complete the task, or null if task is complete'),
          }),
          z.object({
            kind: z.literal('error'),
            reasoning: z.string().describe('The reason why you cannot complete the task'),
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

  if (result.response.kind === 'error') {
    throw new Error(result.response.reasoning)
  }

  const agentResponse = [
    {
      role: 'assistant' as const,
      content: result.response.result,
    },
  ]

  if (result.response.nextStep) {
    return [
      [
        ...agentResponse,
        {
          role: 'user',
          content: result.response.nextStep,
        },
      ],
      'step',
    ]
  }

  return [agentResponse, 'complete']
}
