import s from 'dedent'

import { Agent } from './agent.js'
import { openai, Provider } from './models/openai.js'
import { Message } from './types.js'

type WorkflowOptions = {
  description: string
  output: string
  members: Agent[]

  provider?: Provider
  maxIterations?: number
}

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions): Workflow => {
  return {
    maxIterations: 50,
    provider: openai(),
    ...options,
  }
}

export type Workflow = Required<WorkflowOptions>

export type WorkflowState = {
  status: 'running' | 'finished' | 'interrupted' | 'failed' | 'pending'
  messages: Message[]
}

/**
 * Helper utility to create a workflow state with defaults.
 */
export const workflowState = (workflow: Workflow): WorkflowState => {
  return {
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
