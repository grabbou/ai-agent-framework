import s from 'dedent'

import { Message } from './types.js'
import { Workflow } from './workflow.js'

type WorkflowStateOptions = {
  agent: string

  status?: 'idle' | 'running' | 'paused' | 'finished' | 'failed'
  messages?: Message[]
  children?: WorkflowState[]
}

export const childState = (options: WorkflowStateOptions): WorkflowState => {
  const { status = 'idle', messages = [], agent, children = [] } = options
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

export const getRequest = (state: WorkflowState): Message => {
  return state.messages[0]
}

export const finish = (state: WorkflowState, response: Message): WorkflowState => {
  return {
    ...state,
    status: 'finished',
    messages: [getRequest(state), response],
  }
}

export const delegate = (state: WorkflowState, requests: [string, Message][]): WorkflowState => {
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

export const handoff = (
  state: WorkflowState,
  agent: string,
  messages: Message[]
): WorkflowState => {
  return childState({
    agent,
    messages,
  })
}

export const response = (content: string): Message => {
  return {
    role: 'assistant',
    content,
  }
}

export const request = (content: string): Message => {
  return {
    role: 'user',
    content,
  }
}
