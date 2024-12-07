import { Agent } from './agent.js'
import { Model, openai } from './models/openai.js'
import { RequiredOptionals } from './types.js'

type WorkflowOptions = {
  description: string
  output: string
  members: Agent[]

  model?: Model
  maxIterations?: number
}

const defaults: RequiredOptionals<WorkflowOptions> = {
  maxIterations: 50,
  model: openai(),
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
