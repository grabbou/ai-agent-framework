import { Agent } from './agent.js'
import { supervisor } from './supervisor.js'
import { Message, RequiredOptionals } from './types.js'

type WorkflowStateOptions = {
  request: Message[]

  status?: 'idle' | 'assigned' | 'running' | 'paused' | 'finished' | 'failed'
  messages?: Message[]
  agent?: Agent
  child?: WorkflowState | null
}

const defaults: RequiredOptionals<WorkflowStateOptions> = {
  status: 'idle',
  agent: supervisor,
  messages: [],
  child: null,
}

export const workflowState = (options: WorkflowStateOptions): WorkflowState => {
  return {
    ...defaults,
    ...options,
  }
}

export type WorkflowState = Required<WorkflowStateOptions>
