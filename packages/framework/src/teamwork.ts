import { iterate } from './supervisor/iterate.js'
import { MessageContent } from './types.js'
import { Workflow, WorkflowState, workflowState } from './workflow.js'

/**
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 */
export async function teamwork(
  workflow: Workflow,
  state: WorkflowState = workflowState(workflow)
): Promise<MessageContent> {
  const { status, messages } = state

  if (status === 'finished') {
    return messages.at(-1)!.content
  }

  return teamwork(workflow, await iterate(workflow, state))
}
