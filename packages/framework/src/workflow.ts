import { randomUUID } from 'node:crypto'

import s from 'dedent'

import { Agent } from './agent.js'
import { openai, Provider } from './models.js'
import { noop, Telemetry } from './telemetry.js'
import { Message } from './types.js'

type WorkflowOptions = {
  description: string
  output: string
  members: Agent[]

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

/**
 * Base workflow
 */
type BaseWorkflowState = {
  id: string
  messages: Message[]
}

/**
 * Different states workflow is in, in between execution from agents
 */
export type IdleWorkflowState = BaseWorkflowState & {
  status: 'idle' | 'finished' | 'failed'
}

/**
 * Supervisor selected the task, and is now pending assignement of an agent
 */
export type PendingWorkflowState = BaseWorkflowState & {
  status: 'pending'
  agentRequest: Message[]
}

/**
 * State in which an agent is assigned and work is pending
 */
export type AssignedWorkflowState = BaseWorkflowState & {
  status: 'assigned'

  agent: string
  agentRequest: Message[]
  agentStatus: 'idle' | 'step' | 'tool'
}

export type WorkflowState = IdleWorkflowState | PendingWorkflowState | AssignedWorkflowState

/**
 * Helper utility to create a workflow state with defaults.
 */
export const workflowState = (workflow: Workflow): IdleWorkflowState => {
  return {
    id: randomUUID(),
    status: 'idle',
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
