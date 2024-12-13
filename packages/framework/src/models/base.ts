import { ParsedChatCompletionMessage } from 'openai/resources/beta/chat/completions.mjs'
import { z } from 'zod'

import { Tool } from '../tool.js'
import { Message } from '../types.js'

type LLMCall<T> = {
  name: string
  messages: Message[]
  response_format: z.ZodType<T>
  temperature?: number
  tools?: Record<string, Tool>
}

export type Provider = {
  completions<T>(args: LLMCall<T>): Promise<ParsedChatCompletionMessage<T>>
}
