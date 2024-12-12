import { ParsedFunctionToolCall } from 'openai/resources/beta/chat/completions.mjs'

import { WorkflowState } from './state.js'
import { isToolCallRequest } from './utils/runTools.js'

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
