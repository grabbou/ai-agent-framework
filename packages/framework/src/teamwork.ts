import { workflowState } from './state.js'
import { WorkflowState } from './state.js'
import { iterate } from './supervisor/nextTick.js'
import { Workflow } from './workflow.js'

/**
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 */
export async function teamwork(
  workflow: Workflow,
  state: WorkflowState = workflowState({
    request: [
      {
        role: 'user',
        content: `<workflow>${workflow.description}</workflow><output>${workflow.output}`,
      },
    ],
  })
): Promise<WorkflowState> {
  if (state.status === 'finished' && state.child === null) {
    return state
  }
  return teamwork(workflow, await iterate(workflow, state))
}
