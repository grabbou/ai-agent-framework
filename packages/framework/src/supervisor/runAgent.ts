import s from 'dedent'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { Agent } from '../agent.js'
import { Message, Usage } from '../types.js'

export type RunAgentResult = {
  message: Message
  kind: 'step' | 'complete' | 'tool'
  usage?: Usage
}

export async function runAgent(
  agent: Agent,
  agentContext: Message[],
  agentRequest: Message[]
): Promise<RunAgentResult> {
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
          }),
          z.object({
            kind: z.literal('complete'),
            result: z
              .string()
              .describe(
                'The final result of the task. Include all relevant information from previous steps.'
              ),
            reasoning: z.string().describe('The reasoning for completing the task'),
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
    return { message: response.choices[0].message, kind: 'tool', usage: response.usage }
  }

  const result = response.choices[0].message.parsed
  if (!result) {
    throw new Error('No parsed response received')
  }

  if (result.response.kind === 'error') {
    throw new Error(result.response.reasoning)
  }

  return {
    message: {
      role: 'assistant',
      content: result.response.result,
    },
    kind: result.response.kind,
    usage: response.usage,
  }
}
