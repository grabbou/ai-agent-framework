import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export type Message = ChatCompletionMessageParam
export type MessageContent = Message['content']
