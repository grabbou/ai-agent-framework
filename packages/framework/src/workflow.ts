import { Agent } from './agent.js'
import { openai, Provider } from './models/openai.js'
import { RequiredOptionals } from './types.js'

type WorkflowOptions = {
  description: string
  output: string
  members: Agent[]

  provider?: Provider
  maxIterations?: number
}

const defaults: RequiredOptionals<WorkflowOptions> = {
  maxIterations: 50,
  provider: openai(),
}

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions): Workflow => {
  return {
    ...defaults,
    ...options,
  }
}

export type Workflow = Required<WorkflowOptions>
