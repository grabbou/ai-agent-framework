import { WorkflowState } from './workflow.js'

export type Telemetry = (state: WorkflowState) => void

export const noop: Telemetry = () => {}

export const logger: Telemetry = (state) => {
  console.log(state)
}
