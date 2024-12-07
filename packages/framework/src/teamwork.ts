import { executeTaskWithAgent } from './executor.js'
import { getNextTask } from './supervisor/nextTask.js'
import { selectAgent } from './supervisor/selectAgent.js'
import { Message } from './types.js'
import { Workflow } from './workflow.js'

export async function iterate(workflow: Workflow): Promise<Workflow> {
  const { messages, provider, members } = workflow

  const task = await getNextTask(provider, messages)
  if (!task) {
    return {
      ...workflow,
      messages,
      status: 'finished',
    }
  }

  // tbd: implement `final answer` flow to generate output message
  if (messages.length > workflow.maxIterations) {
    return {
      ...workflow,
      messages,
      status: 'interrupted',
    }
  }

  // tbd: get rid of console.logs, use telemetry instead
  console.log('🚀 Next task:', task)

  const selectedAgent = await selectAgent(provider, task, members)
  console.log('🚀 Selected agent:', selectedAgent.role)

  const agentRequest: Message[] = [
    ...messages,
    {
      role: 'user',
      content: task,
    },
  ]

  try {
    const result = await executeTaskWithAgent(selectedAgent, agentRequest, members)
    return {
      ...workflow,
      messages: [
        ...agentRequest,
        {
          role: 'assistant',
          content: result,
        },
      ],
      status: 'running',
    }
  } catch (error) {
    return {
      ...workflow,
      messages: [
        ...agentRequest,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      status: 'failed',
    }
  }
}

export async function teamwork(workflow: Workflow): Promise<string> {
  const result = await iterate(workflow)

  if (result.status === 'running') {
    return teamwork(result)
  }

  if (result.status === 'finished') {
    return result.messages.at(-1)!.content as string
  }

  // tbd: recover from errors
  // tbd: request final answer if took too long
  throw new Error('Workflow failed. This is not implemented yet.')
}
