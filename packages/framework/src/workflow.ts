import { Agent } from './agent.js'
import { RequiredOptionals } from './types.js'

type WorkflowOptions = {
  description: string
  output: string
  members: Agent[]
  maxIterations?: number
}

const defaults: RequiredOptionals<WorkflowOptions> = {
  // tbd: set reasonable max iterations
  maxIterations: 50,
}

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions) => {
  return {
    ...defaults,
    ...options,
  }
}

export type Workflow = Required<WorkflowOptions>
