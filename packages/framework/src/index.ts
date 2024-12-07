import s from 'dedent'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { Agent } from './agent.js'
import { executeTaskWithAgent } from './executor.js'
import { Message } from './types.js'

// tbd: abstract this away or not? most APIs are OpenAI compatible
const openai = new OpenAI()

export async function teamwork(
  workflow: Workflow,
  context: WorkflowContext = {
    messages: [
      {
        role: 'assistant',
        content: s`
        Here is description of the workflow and expected output by the user:
        <workflow>${workflow.description}</workflow>
        <output>${workflow.output}</output>
      `,
      },
    ],
  }
): Promise<string> {
  // tbd: set reasonable max iterations
  // eslint-disable-next-line no-constant-condition
  const task = await getNextTask(context.messages)
  if (!task) {
    return context.messages.at(-1)!.content as string // end of the recursion
  }

  if (workflow.maxIterations && context.messages.length > workflow.maxIterations) {
    console.debug('Max iterations exceeded ', workflow.maxIterations)
    return context.messages.at(-1)!.content as string
  }

  console.log('🚀 Next task:', task)

  context.messages.push({
    role: 'user',
    content: task,
  })

  // tbd: this throws, handle it
  const selectedAgent = await selectAgent(task, workflow.members)
  console.log('🚀 Selected agent:', selectedAgent.role)

  // tbd: this should just be a try/catch
  // tbd: do not return string, but more information or keep memory in agent
  try {
    const result = await executeTaskWithAgent(selectedAgent, context.messages, workflow.members)
    context.messages.push({
      role: 'assistant',
      content: result,
    })
  } catch (error) {
    console.log('🚀 Task error:', error)
    context.messages.push({
      role: 'assistant',
      content: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return teamwork(workflow, context) // next iteration
}

type Workflow = {
  description: string
  output: string
  members: Agent[]
  maxIterations?: number
}

type WorkflowContext = {
  messages: Message[]
  // tbd: add more context like trace, callstack etc. context should be serializable
}

async function selectAgent(task: string, agents: Agent[]): Promise<Agent> {
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: s`
          You are an agent selector that matches tasks to the most capable agent.
          Analyze the task requirements and each agent's capabilities to select the best match.
          
          Consider:
          1. Required tools and skills
          2. Agent's specialization
          3. Model capabilities
          4. Previous task context if available
        `,
      },
      {
        role: 'user',
        content: s`
          Here is the task:
          <task>${task}</task>

          Here are the available agents:
          <agents>
            ${agents.map((agent, index) => `<agent index="${index}">${agent}</agent>`)}
          </agents>

          Select the most suitable agent for this task.
        `,
      },
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

  const agent = agents[content.agentIndex]
  if (!agent) {
    throw new Error('Invalid agent')
  }

  return agent
}

async function getNextTask(history: Message[]): Promise<string | null> {
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o',
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
