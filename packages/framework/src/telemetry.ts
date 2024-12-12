import chalk from 'chalk'

import { WorkflowState } from './state.js'

export type Telemetry = ({
  prevState,
  nextState,
}: {
  prevState: WorkflowState
  nextState: WorkflowState
}) => void

export const noop: Telemetry = () => {}

export const logger: Telemetry = ({ prevState, nextState }) => {
  const logMessage = (emoji: string, message: string, details: string = '') => {
    console.log(`${emoji} ${chalk.bold(message)}${details ? `\n${chalk.gray(details)}` : ''}`)
  }

  // Skip if state hasn't changed
  if (prevState === nextState) return

  // Handle child state changes
  if (nextState.child && (!prevState?.child || prevState.child !== nextState.child)) {
    logMessage(
      '📤',
      `Delegating task to ${nextState.child.agent}`,
      `Parent agent: ${nextState.agent}`
    )
  }

  // Log status changes
  switch (nextState.status) {
    case 'running':
      logMessage(
        '🛠️',
        `Agent "${nextState.agent}" is working`,
        `Latest message: ${nextState.messages.at(-1)?.content}`
      )
      break
    case 'paused':
      logMessage('⏸️', `Agent "${nextState.agent}" paused`)
      break
    case 'finished':
      logMessage(
        '✅',
        `Agent "${nextState.agent}" finished successfully`,
        `Total messages: ${nextState.messages.length}`
      )
      break
    case 'failed':
      logMessage('❌', `Agent "${nextState.agent}" failed`, `Check logs for more details`)
      break
  }

  // Recursively log child state changes
  if (nextState.child) {
    logger({ prevState: prevState?.child ?? null, nextState: nextState.child })
  }
}
