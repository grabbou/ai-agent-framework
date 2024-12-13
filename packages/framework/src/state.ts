import s from 'dedent'

import { AgentName } from './agent.js'
import { Conversation, Request, Response, user } from './messages.js'
import { Workflow } from './workflow.js'

type WorkflowStateOptions = {
  agent: string
  messages: Conversation

  status?: 'idle' | 'running' | 'paused' | 'finished' | 'failed'
  children?: WorkflowState[]
}

export const childState = (options: WorkflowStateOptions): WorkflowState => {
  const { status = 'idle', messages, agent, children = [] } = options
  return {
    status,
    messages,
    agent,
    children,
  }
}

export const rootState = (workflow: Workflow): WorkflowState =>
  childState({
    agent: 'supervisor',
    messages: [
      user(s`
        Here is my workflow: 
        <request>
          <workflow>${workflow.description}</workflow>
          <output>${workflow.output}</output>
        </request>

        Here is all important knowledge:
        <knowledge>${workflow.knowledge}</knowledge>
      `),
    ],
  })

export type WorkflowState = Required<WorkflowStateOptions>

export const finish = (state: WorkflowState, response: Response): WorkflowState => {
  return {
    ...state,
    status: 'finished',
    messages: [state.messages[0], response],
  }
}

type DelegationRequest = [AgentName, Request]
export const delegate = (state: WorkflowState, requests: DelegationRequest[]): WorkflowState => {
  return {
    ...state,
    status: 'running',
    children: requests.map(([agent, request]) =>
      childState({
        agent,
        messages: [request],
      })
    ),
  }
}

export const handoff = (state: WorkflowState, agent: AgentName): WorkflowState => {
  return childState({
    agent,
    messages: state.messages,
  })
}
