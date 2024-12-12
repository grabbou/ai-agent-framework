import { iterate } from './iterate.js'
import { rootState } from './state.js'
import { WorkflowState } from './state.js'
import { Workflow } from './workflow.js'

/**
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 * If you handle running tools manually, you can set runTools to false.
 */
export async function teamwork(
  workflow: Workflow,
  state: WorkflowState = rootState(workflow),
  runTools: boolean = true
): Promise<WorkflowState> {
  if (state.status === 'finished' && state.child === null) {
    return state
  }
  if (runTools === false && hasPausedStatus(state)) {
    return state
  }
  return teamwork(workflow, await iterate(workflow, state), runTools)
}

/**
 * Recursively checks if any state or nested state has a 'paused' status
 */
export const hasPausedStatus = (state: WorkflowState): boolean => {
  if (state.status === 'paused') {
    return true
  }

  if (!state.child) {
    return false
  }

  return state.child.some(hasPausedStatus)
}
