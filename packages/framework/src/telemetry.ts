import { WorkflowState } from './state.js'

export type Telemetry = ({
  prevState,
  nextState,
}: {
  prevState: WorkflowState
  nextState: WorkflowState
}) => void

export const noop: Telemetry = () => {}

export const logger: Telemetry = ({ nextState }) => {
  // console.log(nextState)
  // console.log(nextState?.child?.agent.role, nextState?.child?.request)
  // console.log(nextState?.child?.child?.agent.role, nextState?.child?.child?.request)
}
