import { Agent } from './agent.js'
import { finalBoss } from './agents/final_boss.js'
import { resourcePlanner } from './agents/resource_planner.js'
import { supervisor } from './agents/supervisor.js'
import { openai, Provider } from './models.js'
import { logger, Telemetry } from './telemetry.js'

type WorkflowOptions = {
  description: string
  output: string

  team: Team

  provider?: Provider
  maxIterations?: number
  snapshot?: Telemetry
}

export type Team = Record<string, Agent>

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions): Workflow => {
  const team = {
    supervisor: supervisor(),
    resourcePlanner: resourcePlanner(),
    finalBoss: finalBoss(),
    ...options.team,
  }
  return {
    maxIterations: 50,
    provider: openai(),
    snapshot: logger,
    ...options,
    team,
  }
}

export type Workflow = Required<WorkflowOptions>
