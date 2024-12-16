import { rootState, WorkflowState } from 'fabrice-ai/state'
import { teamwork } from 'fabrice-ai/teamwork'
import { Workflow } from 'fabrice-ai/workflow'

import { iterate } from './iterate.js'
import { TestSuite } from './suite.js'

/**
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 * If you handle running tools manually, you can set runTools to false.
 */
export async function testwork(
  workflow: Workflow,
  suite: TestSuite,
  state: WorkflowState = rootState(workflow),
  runTools: boolean = true
): Promise<WorkflowState> {
  return teamwork(workflow, await iterate(workflow, suite, state), runTools)
}
