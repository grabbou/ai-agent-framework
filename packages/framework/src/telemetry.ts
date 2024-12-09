import chalk from 'chalk'

import { isToolCallRequest } from './supervisor/runTools.js'
import { WorkflowState } from './workflow.js'

export type Telemetry = ({
  prevState,
  nextState,
}: {
  prevState: WorkflowState
  nextState: WorkflowState
}) => void

export const noop: Telemetry = () => {}

export const logger: Telemetry = ({ prevState, nextState }) => {
  const { status: prevStatus } = prevState
  const { status: nextStatus } = nextState

  const logMessage = (emoji: string, message: string, details: string = '') => {
    console.log(`${emoji} ${chalk.bold(message)}${details ? `\n${chalk.gray(details)}` : ''}`)
  }

  if (prevStatus !== nextStatus) {
    switch (nextStatus) {
      case 'pending':
        logMessage(
          '🕒',
          'Distributing the task...',
          `Request: ${nextState.agentRequest[0].content}`
        )
        break
      case 'assigned':
        switch (nextState.agentStatus) {
          case 'idle':
            logMessage('🛠️', `Agent "${nextState.agent}" is beginning to work on the task`)
            break
          case 'step':
            logMessage(
              '🔄',
              `Agent "${nextState.agent}" is proceeding to the next step`,
              `Step details: ${nextState.agentRequest[0].content}`
            )
            break
          case 'tool': {
            const lastMessage = nextState.agentRequest[nextState.agentRequest.length - 1]
            if (!isToolCallRequest(lastMessage)) {
              return
            }
            const toolNames = lastMessage.tool_calls.map((tool) => tool.function.name)
            logMessage(
              '🔧',
              `Agent "${nextState.agent}" is calling tools`,
              `Tools: ${toolNames.join(', ')}`
            )
            break
          }
        }
        break
      case 'idle':
        logMessage(
          '✅',
          'Moving to next task',
          `Iterations: ${Math.floor((nextState.messages.length - 1) / 2)}`
        )
        break
      case 'finished':
        logMessage(
          '🎉',
          'Workflow finished successfully!',
          `Total messages: ${nextState.messages.length}`
        )
        break
      case 'failed':
        logMessage('❌', 'Workflow failed', `Check logs for more details`)
        break
      default:
        logMessage('ℹ️', 'State changed', `New status: ${nextStatus}`)
    }
  }
}
