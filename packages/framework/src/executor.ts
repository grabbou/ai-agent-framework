import s from 'dedent'

import { Message } from './types.js'
import { Workflow } from './workflow.js'

// tbd: add more context like trace, callstack etc. context should be serializable
type ContextOptions = {
  workflow: Workflow
  // tbd: move messages to something such as memory
  messages?: Message[]
}

/**
 * Helper utility to create a context with defaults.
 */
export const context = (options: ContextOptions): Context => {
  return {
    ...options,
    messages: [
      {
        role: 'assistant',
        content: s`
        Here is description of the workflow and expected output by the user:
        <workflow>${options.workflow.description}</workflow>
        <output>${options.workflow.output}</output>
      `,
      },
    ],
  }
}

export type Context = Required<ContextOptions>

// tbd: helper utilities to create contexts from workflows with concrete single task etc.
