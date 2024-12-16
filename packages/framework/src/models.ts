import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod.mjs'
import { ParsedFunctionToolCall } from 'openai/resources/beta/chat/completions'
import { z, ZodObject } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { Tool } from './tool.js'
import { Message } from './types.js'

/**
 * Resposne format for LLM calls is an object of Zod schemas.
 *
 * The object is then converted either to discriminated union or tool calls,
 * depending on the provider.
 */
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

/**
 * Interface for LLM providers
 */
export interface Provider {
  /**
   * Method for chat-like interactions with LLM.
   *
   * For response_format such as:
   * ```
   * { a: z.object({ b: z.string() }) }
   * ```
   * the return type is:
   * ```
   * { type: "a", value: { b: string } }
   * ```
   *
   * If you pass tools, the return type is further extended with:
   * ```
   * { type: 'tool_call', value: ParsedFunctionToolCall[] }
   * ```
   */
  chat<T extends LLMResponseFormat>(
    args: LLMCallWithTools<T>
  ): Promise<FunctionToolCall | LLMResponse<T>>
  chat<T extends LLMResponseFormat>(args: LLMCall<T>): Promise<LLMResponse<T>>
}

/**
 * Converts an object of tools to OpenAI tools format.
 */
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
 * to OpenAI structured output.
 *
 * Each key in the union is converted to a discriminated union, such as:
 * ```
 * z.discriminatedUnion('type', [
 *   z.object({ type: z.literal('a'), value: z.object({ b: z.string() }) }),
 * ])
 * ```
 */
export const responseAsStructuredOutput = (response_format: Record<string, any>) => {
  const [first, ...rest] = Object.entries(response_format)
  return zodResponseFormat(
    z.object({
      response: z.discriminatedUnion('type', [entryToObject(first), ...rest.map(entryToObject)]),
    }),
    'task_result'
  )
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
export const responseAsToolCall = (
  response_format: Record<string, any>,
  strict: boolean = true
) => {
  return Object.entries(response_format).map(([name, schema]) => ({
    type: 'function' as const,
    function: {
      name,
      parameters: zodToJsonSchema(schema),
      description: s`
        Call this function when you are done processing user request
        and want to return "${name}" as the result.
      `,
      strict,
    },
  }))
}
