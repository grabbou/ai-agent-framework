import { randomUUID } from 'node:crypto'

import s from 'dedent'

import { Agent } from './agent.js'
import { openai, Provider } from './models/openai.js'
import { noopTelemetry, Telemetry } from './telemetry/base.js'
import { Message } from './types.js'

type WorkflowOptions = {
  description: string
  output: string
  members: Agent[]

  provider?: Provider
  maxIterations?: number
  telemetry?: Telemetry
}

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions): Workflow => {
  return {
    maxIterations: 50,
    provider: openai(),
    telemetry: noopTelemetry,
    ...options,
  }
}

export type Workflow = Required<WorkflowOptions>

export type WorkflowState = {
  id: string
  status: 'idle' | 'running' | 'finished' | 'failed' | 'pending'
  messages: Message[]
  agent?: string
  agentRequest?: Message[]
}

/**
 * Helper utility to create a workflow state with defaults.
 */
export const workflowState = (workflow: Workflow): WorkflowState => {
  return {
    id: randomUUID(),
    status: 'pending',
    messages: [
      {
        role: 'assistant' as const,
        content: s`
          Here is description of the workflow and expected output by the user:
          <workflow>${workflow.description}</workflow>
          <output>${workflow.output}</output>
        `,
      },
    ],
  }
}
