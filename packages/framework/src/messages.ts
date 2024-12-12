import s from 'dedent'

import { Message } from './types.js'

const groupMessagePairs = <T>(messages: T[]): T[][] => {
  return messages.reduce((pairs: T[][], message: T, index: number) => {
    if (index % 2 === 0) {
      pairs.push([message])
    } else {
      pairs[pairs.length - 1].push(message)
    }
    return pairs
  }, [])
}

/**
 * Chat conversation is stored as an array of [task, result, task, result...] pairs.
 * This function groups them and returns them as an array of steps.
 */
export const getSteps = (conversation: Message[]): Message[] => {
  const steps = groupMessagePairs(conversation)
  return steps.map(([task, result]) => ({
    role: 'user' as const,
    content: s`
      Step name: ${task.content}
      Step result: ${result.content}
    `,
  }))
}
