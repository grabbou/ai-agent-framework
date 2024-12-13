import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.js'

export type Response = ChatCompletionAssistantMessageParam
export const response = (content: string): Response => {
  return {
    role: 'assistant',
    content,
  }
}

export type Request = ChatCompletionUserMessageParam
export const request = (content: string): Request => {
  return {
    role: 'user',
    content,
  }
}

export type System = ChatCompletionSystemMessageParam
export const system = (content: string): System => {
  return {
    role: 'system',
    content,
  }
}

export type Tool = ChatCompletionToolMessageParam
export const toolResult = (toolCallId: string, content: string): Tool => {
  return {
    role: 'tool',
    tool_call_id: toolCallId,
    content,
  }
}

export type Message = ChatCompletionMessageParam
export type Conversation = [Request, ...Message[]]
