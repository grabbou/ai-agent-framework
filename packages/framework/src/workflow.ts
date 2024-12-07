import s from 'dedent'

import { Agent } from './agent.js'
import { openai, Provider } from './models/openai.js'
import { Message } from './types.js'

type WorkflowOptions = {
  description: string
  output: string
  members: Agent[]

  provider?: Provider
  messages?: Message[]

  maxIterations?: number
}

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions): Workflow => {
  return {
    maxIterations: 50,
    provider: openai(),
    messages: [
      {
        role: 'assistant' as const,
        content: s`
          Here is description of the workflow and expected output by the user:
          <workflow>${options.description}</workflow>
          <output>${options.output}</output>
        `,
      },
    ],
    ...options,
  }
}

export type Workflow = Required<WorkflowOptions>
