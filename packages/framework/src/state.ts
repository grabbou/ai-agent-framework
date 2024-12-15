import s from 'dedent'

import { AgentName } from './agent.js'
import { Conversation, Request, Response, user } from './messages.js'
import { Workflow } from './workflow.js'

/**
 * Workflow Status
 */
type WorkflowStatus =
  /** No work has been started yet. */
  | 'idle'
  /** Work is in progress. */
  | 'running'
  /** ork is paused and there are tools that must be called to resume. */
  | 'paused'
  /** Work is complete. */
  | 'finished'
  /** Work has failed due to an error. */
  | 'failed'

type WorkflowStateOptions = {
  agent: string
  messages: Conversation

  status?: WorkflowStatus
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

/**
 * Creates a root state for the given workflow.
 * Like `childState`, except it provides initial request based on the workflow.
 */
export const rootState = (workflow: Workflow): WorkflowState =>
  childState({
    agent: 'supervisor',
    messages: [
      user(s`
        Here is description of my workflow:
        <workflow>
          ${workflow.description}
          Create ${workflow.output}
        </workflow>

        Here is all the knowledge available:
        <knowledge>${workflow.knowledge}</knowledge>
      `),
    ],
  })

export type WorkflowState = Required<WorkflowStateOptions>

/**
 * Finishes the current state.
 * Result is a tuple of [request, response].
 */
export const finish = (state: WorkflowState, response: Response): WorkflowState => {
  return {
    ...state,
    status: 'finished',
    messages: [state.messages[0], response],
  }
}

/**
 * Creates a new child state with given request.
 * This effectively "delegates" the task to the given agent.
 */
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

/**
 * Creates a new child state with the same messages and tools.
 * This effectively "hands off" the task to the next agent.
 */
export const handoff = (state: WorkflowState, agent: AgentName): WorkflowState => {
  return childState({
    agent,
    messages: state.messages,
  })
}
