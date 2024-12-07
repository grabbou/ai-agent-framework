import { Tool } from './tool.js'
import { RequiredOptionals } from './types.js'

type AgentOptions = {
  role: string
  description: string
  tools?: {
    [key: string]: Tool
  }
  model?: string
}

export type Agent = AgentOptions

const defaults: RequiredOptionals<AgentOptions> = {
  tools: {},
  model: 'gpt-4o',
}

/**
 * Helper utility to create an agent with defaults.
 */
export const agent = (options: AgentOptions): Agent => {
  return {
    ...defaults,
    ...options,
  }
}

export type Agent = Required<AgentOptions>
