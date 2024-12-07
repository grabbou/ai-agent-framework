import { nanoid } from 'nanoid'

import { Context, context, executeTaskWithAgent } from './executor.js'
import { getNextTask, selectAgent } from './index.js'
import { Memory } from './memory.js'
import { Workflow } from './workflow.js'

async function executeStep(context: Context, memory: Memory): Promise<string> {
  // eslint-disable-next-line no-constant-condition
  const task = await getNextTask(context.messages)
  if (!task) {
    return context.messages.at(-1)!.content as string // end of the recursion
  }

  if (context.workflow.maxIterations && context.messages.length > context.workflow.maxIterations) {
    console.debug('Max iterations exceeded ', context.workflow.maxIterations)
    return context.messages.at(-1)!.content as string
  }

  console.log('🚀 Next task:', task)

  context.messages.push({
    role: 'user',
    content: task,
  })
  memory.save(context)

  // tbd: this throws, handle it
  const selectedAgent = await selectAgent(task, context.workflow.members)
  console.log('🚀 Selected agent:', selectedAgent.role)

  // tbd: this should just be a try/catch
  // tbd: do not return string, but more information or keep memory in agent
  try {
    const result = await executeTaskWithAgent(
      selectedAgent,
      context.messages,
      context.workflow.members
    )
    context.messages.push({
      role: 'assistant',
      content: result,
    })
    memory.save(context)
  } catch (error) {
    console.log('🚀 Task error:', error)
    context.messages.push({
      role: 'assistant',
      content: error instanceof Error ? error.message : 'Unknown error',
    })
    memory.save(context)
  }

  return context.messages.at(-1)!.content as string
}

export async function teamworkStep(
  id: string,
  workflow: Workflow,
  memory: Memory
): Promise<string> {
  const ctx = context({ workflow, id: id ?? nanoid() })
  memory.load(ctx) // load the context
  return executeStep(ctx, memory)
}
