import { Workflow, WorkflowState } from '../workflow.js'

// Base event structure
export type BaseTelemetryEvent = {
  workflowId: string
  correlationId?: string
}

/**
 * Emitted when a workflow begins execution.
 */
export type WorkflowStartEvent = {
  type: 'workflow.iteration.start'
  data: {
    workflow: Workflow
    state: WorkflowState
  }
}

/**
 * Emitted when a workflow gets the next task
 */
export type WorkflowEndEvent = {
  type: 'workflow.iteration.nextTask'
  data: {
    workflow: Workflow
    task: string
  }
}

export type TelemetryEvent = WorkflowStartEvent | WorkflowEndEvent

export type Telemetry = {
  record: (event: TelemetryEvent) => void | Promise<void>
}

export const noopTelemetry: Telemetry = {
  record: () => {},
}
