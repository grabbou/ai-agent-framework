import { Message } from './types.js'

type WorkflowStateOptions = {
  agent: string

  status?: 'idle' | 'running' | 'paused' | 'finished' | 'failed'
  messages?: Message[]
  child?: WorkflowState | null
}

export const workflowState = (options: WorkflowStateOptions): WorkflowState => {
  const { status = 'idle', messages = [], agent, child = null } = options
  return {
    status,
    messages,
    agent,
    child,
  }
}

export type WorkflowState = Required<WorkflowStateOptions>
