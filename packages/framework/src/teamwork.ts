import s from 'dedent'

import { iterate } from './iterate.js'
import { workflowState } from './state.js'
import { WorkflowState } from './state.js'
import { Workflow } from './workflow.js'

/**
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 * If you handle running tools manually, you can set runTools to false.
 */
export async function teamwork(
  workflow: Workflow,
  state: WorkflowState = workflowState({
    agent: 'supervisor',
    messages: [
      {
        role: 'user',
        content: s`
          Here is description of my workflow and expected output:
          <workflow>${workflow.description}</workflow>
          <output>${workflow.output}</output>
        `,
      },
    ],
  }),
  runTools: boolean = true
): Promise<WorkflowState> {
  if (state.status === 'finished' && state.child === null) {
    return state
  }
  if (runTools === false && hasPausedStatus(state)) {
    return state
  }
  return teamwork(workflow, await iterate(workflow, state))
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

  return hasPausedStatus(state.child)
}
