import s from 'dedent'
import { ParsedFunctionToolCall } from 'openai/resources/beta/chat/completions'
import { z, ZodObject } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

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

export const toLLMTools = (tools: Record<string, Tool>, strict: boolean = true) => {
  return Object.entries(tools).map(([name, tool]) => ({
    type: 'function' as const,
    function: {
      name,
      parameters: zodToJsonSchema(tool.parameters),
      description: tool.description,
      strict,
    },
  }))
}

/**
 * Converts an object such as
 * ```
 * { a: z.object({ b: z.string() }) }
 * ```
 * to a discriminated union such as
 * ```
 * z.discriminatedUnion('type', [
 *   z.object({ type: z.literal('a'), value: z.object({ b: z.string() }) }),
 * ])
 * ```
 * to be used as a response format for OpenAI.
 */
export const responseToDiscriminatedUnion = (response_format: Record<string, any>) => {
  const [first, ...rest] = Object.entries(response_format)
  return z.discriminatedUnion('type', [entryToObject(first), ...rest.map(entryToObject)])
}

const entryToObject = ([key, value]: [string, ZodObject<any>]) => {
  return z.object({ type: z.literal(key), value })
}

/**
 * Converts an object such as
 * ```
 * { a: z.object({ b: z.string() }) }
 * ```
 * to a list of tool calls such as
 * ```
 * [
 *   { type: 'function', function: { name: 'a', parameters: { b: z.string() } } },
 * ]
 * ```
 */
export const responseToToolCalls = (response_format: Record<string, any>) => {
  return Object.entries(response_format).map(([name, schema]) => ({
    type: 'function' as const,
    function: {
      name,
      parameters: zodToJsonSchema(schema),
      description: s`
        Call this function when you are done processing user request
        and want to return "${name}" as the result.
      `,
      strict: false,
    },
  }))
}
