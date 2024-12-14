import s from 'dedent'
import { z } from 'zod'

import { assistant, getSteps, system, user } from './messages.js'
import { Provider } from './models.js'
import { openai } from './providers/openai.js'
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
  provider?: Provider
  run: (
    provider: Provider,
    state: WorkflowState,
    context: Message[],
    workflow: Workflow
  ) => Promise<WorkflowState>
}

export const agent = (options: AgentOptions = {}): Agent => {
  const { description, tools = {}, provider } = options

  return {
    description,
    tools,
    provider,
    run:
      options.run ??
      (async (provider, state, context, workflow) => {
        const [, ...messages] = context

        const response = await provider.chat({
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
          tools,
          response_format: z.object({
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
          name: 'task_result',
        })

        if (response.tool_calls.length > 0) {
          return {
            ...state,
            status: 'paused',
            messages: [...state.messages, response],
          }
        }

        const message = response.parsed
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
