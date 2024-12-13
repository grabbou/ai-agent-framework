import s from 'dedent'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod.js'
import { z } from 'zod'

import { assistant, getSteps, system, user } from './messages.js'
import { openai, Provider } from './models.js'
import { finish, WorkflowState } from './state.js'
import { Tool } from './tool.js'
import { Message } from './types.js'
import { Workflow } from './workflow.js'

export type AgentOptions = Partial<Agent>

export type AgentName = string
export type Agent = {
  description?: string
  tools: {
    [key: AgentName]: Tool
  }
  provider: Provider
  run: (state: WorkflowState, context: Message[], workflow: Workflow) => Promise<WorkflowState>
}

export const agent = (options: AgentOptions = {}): Agent => {
  const { description, tools = {}, provider = openai() } = options

  return {
    description,
    tools,
    provider,
    run:
      options.run ??
      (async (state, context, workflow) => {
        const mappedTools = tools
          ? Object.entries(tools).map(([name, tool]) =>
              zodFunction({
                name,
                parameters: tool.parameters,
                description: tool.description,
              })
            )
          : []

        const [, ...messages] = context

        const response = await provider.completions({
          messages: [
            system(s`
              ${description}

              Your job is to complete the assigned task:
              - You can break down complex tasks into multiple steps if needed.
              - You can use available tools if needed.

              If tool requires arguments, get them from the input, or use other tools to get them.
              Do not fabricate or assume information not present in the input.

              Try to complete the task on your own.
            `),
            assistant('What have been done so far?'),
            user(
              `Here is all the work done so far by other agents: ${JSON.stringify(getSteps(messages))}`
            ),
            assistant(`Is there anything else I need to know?`),
            workflow.knowledge
              ? user(`Here is all the knowledge available: ${workflow.knowledge}`)
              : user(`No, I do not have any additional information.`),
            assistant('What is the task assigned to me?'),
            ...state.messages,
          ],
          tools: mappedTools.length > 0 ? mappedTools : undefined,
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
          return {
            ...state,
            status: 'paused',
            messages: [...state.messages, response.choices[0].message],
          }
        }

        const message = response.choices[0].message.parsed
        if (!message) {
          throw new Error('No parsed response received')
        }

        if (message.response.kind === 'error') {
          throw new Error(message.response.reasoning)
        }

        const agentResponse = assistant(message.response.result)

        if (message.response.nextStep) {
          return {
            ...state,
            status: 'running',
            messages: [...state.messages, agentResponse, user(message.response.nextStep)],
          }
        }

        return finish(state, agentResponse)
      }),
  }
}
