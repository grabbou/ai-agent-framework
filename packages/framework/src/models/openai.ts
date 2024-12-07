import OpenAI, { ClientOptions } from 'openai'

import { RequiredOptionals } from '../types.js'

type OpenAIOptions = {
  name?: string
  options?: ClientOptions
}

const defaults: RequiredOptionals<OpenAIOptions> = {
  name: 'gpt-4o',
  options: {},
}

/**
 * Helper utility to create a model configuration with defaults.
 */
export const openai = (options?: OpenAIOptions) => {
  const config = {
    ...defaults,
    ...options,
  }

  const client = new OpenAI(config.options)

  return {
    name: config.name,
    completions: client.beta.chat.completions.parse.bind(client.beta.chat.completions),
    client,
  }
}

export type Model = ReturnType<typeof openai>
