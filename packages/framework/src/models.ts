import OpenAI, { ClientOptions } from 'openai'
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/index.mjs'

import { RequiredOptionals } from './types.ts'

type OpenAIOptions = {
  model?: string
  options?: ClientOptions
}

const defaults: RequiredOptionals<OpenAIOptions> = {
  model: 'gpt-4o',
  options: {},
}

type ChatCompletionParseParams = ChatCompletionCreateParamsNonStreaming

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
    model: config.model,
    completions: <T extends Omit<ChatCompletionParseParams, 'model'>>(params: T) =>
      client.beta.chat.completions.parse.bind(client.beta.chat.completions)({
        ...params,
        model: config.model,
      }),
    client,
  }
}

export type Provider = ReturnType<typeof openai>
