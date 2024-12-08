import { iterateTaskWithAgent } from './executor.js'
import { finalizeWorkflow } from './supervisor/finalizeWorkflow.js'
import { getNextTask } from './supervisor/nextTask.js'
import { selectAgent } from './supervisor/selectAgent.js'
import { Message, MessageContent } from './types.js'
import { Workflow, WorkflowState, workflowState } from './workflow.js'

export async function iterate(workflow: Workflow, state: WorkflowState): Promise<WorkflowState> {
  const { provider, members, telemetry } = workflow
  const { messages } = state

  telemetry.record({
    type: 'workflow.iteration.start',
    data: {
      workflow,
      state,
    },
  })

  const task = await getNextTask(provider, messages)
  if (!task) {
    return {
      ...state,
      messages,
      status: 'finished',
    }
  }

  telemetry.record({
    type: 'workflow.iteration.nextTask',
    data: {
      workflow,
      task,
    },
  })

  if (messages.length > workflow.maxIterations) {
    return {
      ...state,
      messages,
      status: 'interrupted',
    }
  }

  // tbd: get rid of console.logs, use telemetry instead
  console.log('🚀 Next task:', task)

  // tbd we are each time selecting the agent - if we saved the selected agent in the state, we could reuse it
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
    const agentResponse = await iterateTaskWithAgent(selectedAgent, agentRequest)

    return {
      ...state,
      messages: [...agentResponse.messages],
      status: 'running',
    }
  } catch (error) {
    return {
      ...state,
      messages: [
        ...agentRequest, // no response, it failed
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      status: 'failed',
    }
  }
}

export async function teamwork(
  workflow: Workflow,
  state: WorkflowState = workflowState(workflow)
): Promise<MessageContent> {
  const { status, messages } = state

  if (status === 'pending' || status === 'running') {
    return teamwork(workflow, await iterate(workflow, state))
  }

  if (status === 'finished') {
    return messages.at(-1)!.content
  }

  if (status === 'failed') {
    return ('🚨' + messages.at(-1)!.content) as string
  }

  if (status === 'interrupted') {
    console.log('🚨 Max iterations exceeded ', workflow.maxIterations)
    return finalizeWorkflow(workflow.provider, messages)
  }

  // tbd: recover from errors
  // tbd: request final answer if took too long
  throw new Error('Workflow failed. This is not implemented yet.')
}
