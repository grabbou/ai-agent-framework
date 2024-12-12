import s from 'dedent'
import { agent, AgentOptions } from 'fabrice-ai/agent'
import { childState } from 'fabrice-ai/state'
import { tool } from 'fabrice-ai/tool'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const defaults: AgentOptions = {
  tools: {
    printThePlan: tool({
      description: 'Tool for printing a message to the user',
      parameters: z.object({
        message: z.string().describe('The message to print to the user'),
      }),
      execute: ({ message }) => {
        console.log(message)
        return Promise.resolve('User got the message')
      },
    }),
  },
  run: async (state, context, workflow) => {
    const response = await workflow.team[state.agent].provider.completions({
      messages: [
        {
          role: 'system',
          content: s`
            You are a planner that breaks down complex workflows into smaller, actionable steps.
            Your job is to determine the execution plan of the workflow.
            Print the plan using the 'printThePlan' tool.
            Then return the tasks one by one untill execution plan end.
            Take available agents into consideration.
            If all required tasks are completed, return null.

            Rules:
            1. Each task should be self-contained and achievable
            2. Tasks should be specific and actionable
            3. Return null when the workflow is complete
            4. Consider dependencies and order of operations
            5. Use context from completed tasks to inform next steps

            Here are the available agents:
            <agents>
                ${Object.entries(workflow.team).map(([name, agent]) =>
                  agent.description ? `<agent name="${name}">${agent.description}</agent>` : ''
                )}
            </agents>            
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
          plan: z.array(z.string()).describe('The execution plan of the workflow'),
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
      console.log(content)
      if (!content) {
        throw new Error('No content in response')
      }

      if (!content.task) {
        return {
          ...state,
          status: 'finished',
        }
      }

      const agentRequest = {
        role: 'user' as const,
        content: content.task,
      }

      return {
        ...state,
        status: 'running',
        messages: [...state.messages, agentRequest],
        child: childState({
          agent: 'resourcePlanner',
          messages: [agentRequest],
        }),
      }
    } catch (error) {
      throw new Error('Failed to determine next task')
    }
  },
}

export const staticSupervisor = (options?: AgentOptions) =>
  agent({
    ...defaults,
    ...options,
  })
