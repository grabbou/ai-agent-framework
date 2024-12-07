import { Tool } from './tool.js'
import { RequiredOptionals } from './types.js'

export type AgentOptions = {
  role: string
  description: string
  tools?: {
    [key: string]: Tool
  }
  model?: string
}

const defaults: RequiredOptionals<AgentOptions> = {
  tools: {},
  model: 'gpt-4o',
}

/**
 * Helper utility to create an agent with defaults.
 */
export const agent = (options: AgentOptions) => {
  return {
    ...defaults,
    ...options,
  }
}
