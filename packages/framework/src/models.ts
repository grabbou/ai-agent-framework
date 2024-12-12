import OpenAI, { ClientOptions } from 'openai'
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions'

type OpenAIOptions = {
  model?: string
  options?: ClientOptions
}

type ChatCompletionParseParams = ChatCompletionCreateParamsNonStreaming

/**
 * Helper utility to create a model configuration with defaults.
 */
export const openai = (options: OpenAIOptions = {}) => {
  const { model = 'gpt-4o', options: clientOptions = {} } = options

  const client = new OpenAI(clientOptions)

  return {
    model,
    completions: <T extends Omit<ChatCompletionParseParams, 'model'>>(params: T) =>
      client.beta.chat.completions.parse.bind(client.beta.chat.completions)({
        ...params,
        model,
      }),
    client,
  }
}

export type Provider = ReturnType<typeof openai>
