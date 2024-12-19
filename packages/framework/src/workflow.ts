import { Agent } from './agent.js'
import { finalBoss } from './agents/final_boss.js'
import { resourcePlanner } from './agents/resource_planner.js'
import { supervisor } from './agents/supervisor.js'
import { Provider } from './models.js'
import { openai } from './providers/openai.js'
import { logger, Telemetry } from './telemetry.js'

type WorkflowOptions = {
  description: string
  output: string

  team: Team

  knowledge?: string
  provider?: Provider
  maxIterations?: number
  snapshot?: Telemetry
}

export type Team = Record<string, Agent>

const coreTeam = {
  supervisor: supervisor(),
  resourcePlanner: resourcePlanner(),
  finalBoss: finalBoss(),
}

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions): Workflow => {
  const team = {
    ...coreTeam,
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

export type Workflow = Required<Omit<WorkflowOptions, 'knowledge'>> & {
  knowledge?: string
}

export const isCoreTeam = (name: string) => Object.keys(coreTeam).includes(name)
