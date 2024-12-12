import { WorkflowState } from '../state.js'
import { Workflow } from '../workflow.js'
import { runTools } from './runTools.js'

export async function nextTick(workflow: Workflow, state: WorkflowState): Promise<WorkflowState> {
  if (state.child) {
    const child = await nextTick(workflow, state.child)
    if (child.status === 'finished') {
      console.log('finsihd wiht', child.messages)
      return {
        ...state,
        messages: state.messages.concat(child.request[0], child.request.at(-1)!),
        child: null,
      }
    }
    return {
      ...state,
      child,
    }
  }

  if (state.status === 'paused') {
    const toolsResponse = await runTools(state.agent, state.request)
    return {
      ...state,
      status: 'running',
      request: state.request.concat(toolsResponse),
    }
  }

  if (state.status === 'running' || state.status === 'idle') {
    return state.agent.run(state, workflow)
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
  console.log('\n\n')
  const nextState = await nextTick(workflow, state)
  workflow.snapshot({ prevState: state, nextState })
  return nextState
}
