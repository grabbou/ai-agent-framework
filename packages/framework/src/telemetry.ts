import chalk from 'chalk'

import { WorkflowState } from './state.js'
import { isToolCallRequest } from './utils/runTools.js'

export type Telemetry = ({
  prevState,
  nextState,
}: {
  prevState: WorkflowState
  nextState: WorkflowState
}) => void

export const noop: Telemetry = () => {}

export const logger: Telemetry = ({ prevState, nextState }) => {
  if (prevState === nextState) return

  const getStatusText = (state: WorkflowState) => {
    if (state.agent === 'supervisor') {
      return 'Looking for next task...'
    }
    if (state.agent === 'resourcePlanner') {
      return 'Looking for best agent...'
    }
    switch (state.status) {
      case 'idle':
      case 'running':
        return `Working on: ${state.messages[0].content}`
      case 'paused': {
        const lastMessage = state.messages.at(-1)!
        if (isToolCallRequest(lastMessage)) {
          return `Waiting for tools: ${lastMessage.tool_calls.map((toolCall) => toolCall.function.name).join(', ')}`
        }
        return 'Paused'
      }
      case 'finished':
        return 'Done'
      case 'failed':
        return 'Failed'
    }
  }

  const printTree = (state: WorkflowState, level = 0) => {
    const indent = '  '.repeat(level)
    const arrow = level > 0 ? '└─▶ ' : ''
    const statusText = state.child ? '' : getStatusText(state)

    console.log(`${indent}${arrow}${chalk.bold(state.agent)} ${statusText}`)

    if (state.child) {
      printTree(state.child, level + 1)
    }
  }

  printTree(nextState)
  console.log('') // Empty line for better readability
}
