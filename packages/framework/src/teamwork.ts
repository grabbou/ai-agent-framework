import s from 'dedent'

import { executeTaskWithAgent } from './executor.js'
import { getNextTask } from './supervisor/nextTask.js'
import { selectAgent } from './supervisor/selectAgent.js'
import { Message } from './types.js'
import { Workflow } from './workflow.js'

async function execute(workflow: Workflow, messages: Message[]): Promise<string> {
  const task = await getNextTask(workflow.provider, messages)
  if (!task) {
    return messages.at(-1)!.content as string
  }

  // tbd: implement `final answer` flow
  if (messages.length > workflow.maxIterations) {
    return messages.at(-1)!.content as string
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
  const messages = [
    {
      role: 'assistant' as const,
      content: s`
        Here is description of the workflow and expected output by the user:
        <workflow>${workflow.description}</workflow>
        <output>${workflow.output}</output>
      `,
    },
  ]
  return execute(workflow, messages)
}
