import { Agent } from './agent.js'
import { openai, Provider } from './models.js'
import { noop, Telemetry } from './telemetry.js'

type WorkflowOptions = {
  description: string
  output: string
  team: Record<string, Agent>

  provider?: Provider
  maxIterations?: number
  snapshot?: Telemetry
}

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions): Workflow => {
  return {
    maxIterations: 50,
    provider: openai(),
    snapshot: noop,
    ...options,
  }
}

export type Workflow = Required<WorkflowOptions>
