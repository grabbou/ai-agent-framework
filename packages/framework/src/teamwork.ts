import s from 'dedent'

import { executeTaskWithAgent } from './executor.js'
import { getNextTask } from './supervisor/nextTask.js'
import { selectAgent } from './supervisor/selectAgent.js'
import { Message } from './types.js'
import { Workflow } from './workflow.js'

async function execute(workflow: Workflow, messages: Message[]): Promise<string> {
  // eslint-disable-next-line no-constant-condition
  const task = await getNextTask(workflow.provider, messages)
  if (!task) {
    return messages.at(-1)!.content as string // end of the recursion
  }

  if (workflow.maxIterations && messages.length > workflow.maxIterations) {
    console.debug('Max iterations exceeded ', workflow.maxIterations)
    return messages.at(-1)!.content as string
  }

  console.log('🚀 Next task:', task)

  messages.push({
    role: 'user',
    content: task,
  })

  // tbd: this throws, handle it
  const selectedAgent = await selectAgent(workflow.provider, task, workflow.members)
  console.log('🚀 Selected agent:', selectedAgent.role)

  // tbd: this should just be a try/catch
  // tbd: do not return string, but more information or keep memory in agent
  try {
    const result = await executeTaskWithAgent(selectedAgent, messages, workflow.members)
    messages.push({
      role: 'assistant',
      content: result,
    })
  } catch (error) {
    console.log('🚀 Task error:', error)
    messages.push({
      role: 'assistant',
      content: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return execute(workflow, messages)
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
