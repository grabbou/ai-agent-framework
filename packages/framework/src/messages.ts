import s from 'dedent'
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.js'

export type Response = ChatCompletionAssistantMessageParam
export const assistant = (content: string): Response => {
  return {
    role: 'assistant',
    content,
  }
}

export type Request = ChatCompletionUserMessageParam
export const user = (content: string): Request => {
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

export const getSteps = (conversation: Message[]): Message[] => {
  const messagePairs = conversation.reduce(
    (pairs: Message[][], message: Message, index: number) => {
      if (index % 2 === 0) {
        pairs.push([message])
      } else {
        pairs[pairs.length - 1].push(message)
      }
      return pairs
    },
    []
  )
  return messagePairs.map(([task, result]) =>
    user(s`
      <step>
        <name>${task.content}</name>
        <result>${result.content}</result>
      </step>
    `)
  )
}
