import s from 'dedent'
import { z } from 'zod'

import { assistant, getSteps, Message, system, toolCalls, user } from './messages.js'
import { Provider } from './models.js'
import { finish, WorkflowState } from './state.js'
import { Tool } from './tool.js'
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

              Try to complete the task on your own.
            `),
            assistant('What have been done so far?'),
            user(`Here is all the work done so far by other agents:`),
            ...getSteps(messages),
            assistant(`Is there anything else I need to know?`),
            workflow.knowledge
              ? user(`Here is all the knowledge available: ${workflow.knowledge}`)
              : user(`No, I do not have any additional information.`),
            assistant('What is the request?'),
            ...state.messages,
          ],
          tools,
          response_format: {
            step: z.object({
              name: z.string().describe('Name of the current step or action being performed'),
              result: z
                .string()
                .describe('The output of this step. Include all relevant details and information.'),
              reasoning: z.string().describe('The reasoning for performing this step.'),
              hasNextStep: z.boolean().describe(s`
                The next step ONLY if required by the original request.
                Return "true" if you have fully answered the current request, even if
                you can think of additional tasks.
              `),
              nextStepName: z
                .string()
                .describe('The name of the next step to be performed, if any'),
            }),
            error: z.object({
              reasoning: z.string().describe('The reason why you cannot complete the task'),
            }),
          },
        })

        if (response.type === 'tool_call') {
          return {
            ...state,
            status: 'paused',
            messages: [...state.messages, toolCalls(response.value)],
          }
        }

        if (response.type === 'error') {
          throw new Error(response.value.reasoning)
        }

        const agentResponse = assistant(response.value.result)

        if (response.value.hasNextStep) {
          return {
            ...state,
            status: 'running',
            messages: [...state.messages, agentResponse, user(response.value.nextStepName)],
          }
        }

        return finish(state, agentResponse)
      }),
  }
}
