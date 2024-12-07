import { openai, Provider } from './models/openai.js'
import { Tool } from './tool.js'
import { RequiredOptionals } from './types.js'

type AgentOptions = {
  role: string
  description: string
  tools?: {
    [key: string]: Tool
  }
  provider?: Provider
}

const defaults: RequiredOptionals<AgentOptions> = {
  tools: {},
  provider: openai(),
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
