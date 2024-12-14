import type {
  ParsedChatCompletionMessage,
  ParsedFunctionToolCall,
} from 'openai/resources/beta/chat/completions'
import { ChatCompletionToolMessageParam } from 'openai/resources/chat/completions'

import { Message, toolResult } from './messages.js'
import { Provider } from './models.js'
import { WorkflowState } from './state.js'
import { Workflow } from './workflow.js'

/**
 * Asserts that given message requests tool calls
 */
export function isToolCallRequest(message?: Message): message is ParsedChatCompletionMessage<any> {
  return message ? 'tool_calls' in message : false
}

export async function runTools(
  provider: Provider,
  state: WorkflowState,
  context: Message[],
  workflow: Workflow
): Promise<ChatCompletionToolMessageParam[]> {
  const toolRequests = getAllMissingToolCalls(state)

  if (toolRequests.length === 0) {
    throw new Error('Invalid tool request')
  }

  const { tools } = workflow.team[state.agent]

  const toolResults = await Promise.all(
    toolRequests.map(async (toolCall) => {
      if (toolCall.type !== 'function') {
        throw new Error('Tool call is not a function')
      }

      const tool = tools[toolCall.function.name]
      if (!tool) {
        throw new Error(`Unknown tool: ${toolCall.function.name}`)
      }

      const content = await tool.execute(toolCall.function.parsed_arguments, {
        provider,
        messages: context.concat(state.messages),
      })

      return toolResult(toolCall.id, content)
    })
  )

  return toolResults
}

export const addToolResponse = (
  state: WorkflowState,
  toolCallId: string,
  content: string
): WorkflowState => {
  const toolRequestMessage = state.messages.findLast(isToolCallRequest)
  if (toolRequestMessage) {
    return {
      ...state,
      messages: [...state.messages, toolResult(toolCallId, content)],
    }
  }
  if (state.children.length > 0) {
    return {
      ...state,
      children: state.children.map((child) => addToolResponse(child, toolCallId, content)),
    }
  }
  return state
}

export const resumeCompletedToolCalls = (state: WorkflowState): WorkflowState => {
  const toolRequestMessage = state.messages.findLast(isToolCallRequest)
  if (toolRequestMessage) {
    const hasAllToolCalls = toolRequestMessage.tool_calls.every((tollCall) =>
      state.messages.some(
        (request) => 'tool_call_id' in request && tollCall.id === request.tool_call_id
      )
    )
    if (hasAllToolCalls) {
      return {
        ...state,
        status: 'running' as const,
      }
    }
    return state
  }
  if (state.children.length > 0) {
    return {
      ...state,
      children: state.children.map(resumeCompletedToolCalls),
    }
  }
  return state
}

export const getAllMissingToolCalls = (state: WorkflowState): ParsedFunctionToolCall[] => {
  const toolRequests = state.messages.reduce((acc, message) => {
    if (isToolCallRequest(message)) {
      return acc.concat(message.tool_calls)
    }
    return acc
  }, [] as ParsedFunctionToolCall[])

  const toolResponses = state.messages.reduce((acc, message) => {
    if ('tool_call_id' in message) {
      return acc.concat(message.tool_call_id)
    }
    return acc
  }, [] as string[])

  const missingToolCalls = toolRequests.filter(
    (toolRequest) => !toolResponses.includes(toolRequest.id)
  )

  if (state.children.length > 0) {
    missingToolCalls.push(...state.children.flatMap(getAllMissingToolCalls))
  }

  return missingToolCalls
}
