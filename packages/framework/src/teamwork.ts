import { executeTaskWithAgent } from './executor.js'
import { getNextTask } from './supervisor/nextTask.js'
import { selectAgent } from './supervisor/selectAgent.js'
import { Message } from './types.js'
import { Workflow } from './workflow.js'

async function execute(workflow: Workflow, messages: Message[]): Promise<Message[]> {
  const task = await getNextTask(workflow.provider, messages)
  if (!task) {
    return messages
  }

  // tbd: implement `final answer` flow to generate output message
  if (messages.length > workflow.maxIterations) {
    return [
      ...messages,
      {
        role: 'assistant',
        content: 'Workflow reached maximum iterations',
      },
    ]
  }

  // tbd: get rid of console.logs, use telemetry instead
  console.log('🚀 Next task:', task)

  const selectedAgent = await selectAgent(workflow.provider, task, workflow.members)
  console.log('🚀 Selected agent:', selectedAgent.role)

  const agentRequest: Message[] = [
    ...messages,
    {
      role: 'user',
      content: task,
    },
  ]

  // tbd: do not return string, but more information or keep memory in agent
  try {
    const result = await executeTaskWithAgent(selectedAgent, agentRequest, workflow.members)
    return execute(workflow, [
      ...agentRequest,
      {
        role: 'assistant',
        content: result,
      },
    ])
  } catch (error) {
    return execute(workflow, [
      ...agentRequest,
      {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Unknown error',
      },
    ])
  }
}

export async function teamwork(workflow: Workflow): Promise<string> {
  const history = await execute(workflow, workflow.messages)

  // tbd: verify shape of message
  return history.at(-1)!.content as string
}
