import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { agent } from './agent.js'
import { WorkflowState, workflowState } from './state.js'
import { Workflow } from './workflow.js'

export const supervisor = agent({
  role: 'Supervisor',
  description: s`
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
  run,
})

async function run(state: WorkflowState): Promise<WorkflowState> {
  const { agent, messages } = state
  console.log(messages)
  const response = await agent.provider.completions({
    messages: [
      {
        role: 'system',
        content: `You are ${agent.role}. ${agent.description}`,
      },
      {
        role: 'assistant',
        content: 'What is the request?',
      },
      ...state.request,
      ...messages,
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
      return {
        ...state,
        status: 'finished',
      }
    }
    return {
      ...state,
      status: 'running',
      child: workflowState({
        agent: resourcePlanner,
        messages: state.request.concat(state.messages),
        request: [
          {
            role: 'user',
            content: content.task,
          },
        ],
      }),
    }
  } catch (error) {
    throw new Error('Failed to determine next task')
  }
}

const resourcePlanner = agent({
  role: 'Resource Planner',
  description: s`
    You are an agent selector that matches tasks to the most capable agent.
    Analyze the task requirements and each agent's capabilities to select the best match.
    
    Consider:
    1. Required tools and skills
    2. Agent's specialization
    3. Model capabilities
    4. Previous task context if available  
  `,
  run: resourcePlannerRun,
})

async function resourcePlannerRun(
  state: WorkflowState,
  workflow: Workflow
): Promise<WorkflowState> {
  const response = await state.agent.provider.completions({
    messages: [
      {
        role: 'system',
        content: state.agent.description,
      },
      {
        role: 'user',
        content: s`
          Here are the available agents:
          <agents>
            ${workflow.members.map(
              (agent, index) =>
                `<agent index="${index}">${agent.role} - ${agent.description}</agent>`
            )}
          </agents>
        `,
      },
      {
        role: 'assistant',
        content: 'What is the task?',
      },
      ...state.request,
    ],
    temperature: 0.1,
    response_format: zodResponseFormat(
      z.object({
        agentIndex: z.number(),
        reasoning: z.string(),
      }),
      'agent_selection'
    ),
  })

  const content = response.choices[0].message.parsed
  if (!content) {
    throw new Error('No content in response')
  }

  const agent = workflow.members[content.agentIndex]
  if (!agent) {
    throw new Error('Invalid agent')
  }

  return workflowState({
    agent,
    messages: state.messages,
    request: state.request,
  })
}
