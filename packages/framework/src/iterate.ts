import { WorkflowState } from './state.js'
import { runTools } from './supervisor/runTools.js'
import { Message } from './types.js'
import { Workflow } from './workflow.js'

export async function run(
  state: WorkflowState,
  context: Message[] = [],
  workflow: Workflow
): Promise<WorkflowState> {
  if (state.child) {
    const child = await run(state.child, context.concat(state.messages), workflow)
    if (child.status === 'finished') {
      return {
        ...state,
        messages: state.messages.concat(child.messages),
        child: null,
      }
    }
    return {
      ...state,
      child,
    }
  }

  if (state.status === 'paused') {
    const toolsResponse = await runTools(state.agent, state.messages)
    return {
      ...state,
      status: 'running',
      messages: state.messages.concat(toolsResponse),
    }
  }

  if (state.status === 'running' || state.status === 'idle') {
    return state.agent(state, context, workflow)
  }

  if (state.status === 'failed') {
    return {
      ...state,
      status: 'finished',
    }
  }

  return state
}

/**
 * Iterates over the workflow and takes a snapshot of the state after each iteration.
 */
export async function iterate(workflow: Workflow, state: WorkflowState) {
  console.log('run')
  const nextState = await run(state, [], workflow)
  workflow.snapshot({ prevState: state, nextState })
  return nextState
}
