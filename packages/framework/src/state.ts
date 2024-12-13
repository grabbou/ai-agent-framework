import s from 'dedent'

import { AgentName } from './agent.js'
import { Conversation, Request, request, Response } from './messages.js'
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
      request(s`
        Here is description of my workflow and expected output:
        <workflow>${workflow.description}</workflow>
        <output>${workflow.output}</output>
      `),
    ],
  })

export type WorkflowState = Required<WorkflowStateOptions>

export const getRequest = (state: WorkflowState): Request => {
  return state.messages[0]
}

export const finish = (state: WorkflowState, response: Response): WorkflowState => {
  return {
    ...state,
    status: 'finished',
    messages: [getRequest(state), response],
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
