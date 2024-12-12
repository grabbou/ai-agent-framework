import type {
  ParsedChatCompletionMessage,
  ParsedFunctionToolCall,
} from 'openai/resources/beta/chat/completions'
import { ChatCompletionToolMessageParam } from 'openai/resources/chat/completions'

import { Agent } from './agent.js'
import { WorkflowState } from './state.js'
import { Message } from './types.js'

/**
 * Asserts that given message requests tool calls
 */
export function isToolCallRequest(message?: Message): message is ParsedChatCompletionMessage<any> {
  return message ? 'tool_calls' in message : false
}

export async function runTools(
  agent: Agent,
  agentRequest: Message[]
): Promise<ChatCompletionToolMessageParam[]> {
  // tbd: find cleaner way to do this
  const messages = Array.from(agentRequest)
  const toolCallRequest = messages.pop()

  if (!isToolCallRequest(toolCallRequest)) {
    throw new Error('Invalid tool request')
  }

  const toolResults = await Promise.all(
    toolCallRequest.tool_calls.map(async (toolCall) => {
      if (toolCall.type !== 'function') {
        throw new Error('Tool call is not a function')
      }

      const tool = agent.tools ? agent.tools[toolCall.function.name] : null
      if (!tool) {
        throw new Error(`Unknown tool: ${toolCall.function.name}`)
      }

      const content = await tool.execute(toolCall.function.parsed_arguments, {
        provider: agent.provider,
        messages,
      })
      return {
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify(content),
      }
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
      messages: state.messages.concat({
        role: 'tool',
        tool_call_id: toolCallId,
        content,
      }),
    }
  }
  if (state.child) {
    return addToolResponse(state.child, toolCallId, content)
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
  if (state.child) {
    return resumeCompletedToolCalls(state.child)
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

  if (state.child) {
    missingToolCalls.push(...getAllMissingToolCalls(state.child))
  }

  return missingToolCalls
}
