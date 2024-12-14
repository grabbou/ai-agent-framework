import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export type Message = ChatCompletionMessageParam
export type MessageContent = Message['content']

// like Required<T> but ONLY pick optional fields
export type RequiredOptionals<T> = {
  [K in keyof T as undefined extends T[K] ? K : never]-?: T[K]
}
