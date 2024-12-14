import { ParsedFunctionToolCall } from 'openai/resources/beta/chat/completions'
import { z } from 'zod'

import { Tool } from './tool.js'
import { Message } from './types.js'

type LLMResponseFormat = Record<string, z.ZodObject<any>>

type LLMCall<T extends LLMResponseFormat> = {
  messages: Message[]
  response_format: T
  temperature?: number
}

type LLMCallWithTools<T extends LLMResponseFormat> = LLMCall<T> & {
  tools: Record<string, Tool>
}

type LLMResponse<T extends LLMResponseFormat> = {
  [K in keyof T]: {
    type: K
    value: z.infer<T[K]>
  }
}[keyof T]

type FunctionToolCall = {
  type: 'tool_call'
  value: ParsedFunctionToolCall[]
}

export interface Provider {
  chat<T extends LLMResponseFormat>(
    args: LLMCallWithTools<T>
  ): Promise<FunctionToolCall | LLMResponse<T>>
  chat<T extends LLMResponseFormat>(args: LLMCall<T>): Promise<LLMResponse<T>>
  embeddings(input: string): Promise<number[]>
}
