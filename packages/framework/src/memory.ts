import { Context } from './executor.js'
import { RequiredOptionals } from './types.js'

export type MemoryOptions = {
  save: (context: Context) => void
  load: (context: Context) => Promise<Context>
}

const defaults: RequiredOptionals<MemoryOptions> = {}

/**
 * Helper utility to create a memory with defaults.
 */
export const memory = (options: MemoryOptions): Memory => {
  return {
    ...defaults,
    ...options,
  }
}

export type Memory = Required<MemoryOptions>
