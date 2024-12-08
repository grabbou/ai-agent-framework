import s from 'dedent'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { Agent } from '../agent.js'
import { Message } from '../types.js'

export async function runAgent(
  agent: Agent,
  messages: Message[]
): Promise<[Message[], 'step' | 'complete']> {
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
      ...messages,
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
    const toolResults = await Promise.all(
      response.choices[0].message.tool_calls.map(async (toolCall) => {
        if (toolCall.type !== 'function') {
          throw new Error('Tool call is not a function')
        }

        const tool = agent.tools ? agent.tools[toolCall.function.name] : null
        if (!tool) {
          throw new Error(`Unknown tool: ${toolCall.function.name}`)
        }

        const content = await tool.execute(toolCall.function.parsed_arguments, {
          provider: agent.provider,
          messages,
        })
        return {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify(content),
        }
      })
    )

    return [[response.choices[0].message, ...toolResults], 'step']
  }

  // tbd: verify shape of response
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
