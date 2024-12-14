import { assistant, Message } from './messages.js'
import { childState, finish, WorkflowState } from './state.js'
import { runTools } from './tool_calls.js'
import { Workflow } from './workflow.js'

// tbd: finalize workflow
export async function run(
  state: WorkflowState,
  context: Message[] = [],
  workflow: Workflow
): Promise<WorkflowState> {
  if (state.messages.length > workflow.maxIterations) {
    return childState({
      ...state,
      agent: 'finalBoss',
    })
  }

  if (state.children.length > 0) {
    const children = await Promise.all(
      state.children.map((child) => run(child, context.concat(state.messages), workflow))
    )
    if (children.every((child) => child.status === 'finished')) {
      return {
        ...state,
        messages: [...state.messages, ...children.flatMap((child) => child.messages)],
        children: [],
      }
    }
    return {
      ...state,
      children,
    }
  }

  const agent = workflow.team[state.agent]
  const provider = agent.provider || workflow.provider

  if (state.status === 'paused') {
    const toolsResponse = await runTools(provider, state, context, workflow)
    return {
      ...state,
      status: 'running',
      messages: [...state.messages, ...toolsResponse],
    }
  }

  if (state.status === 'running' || state.status === 'idle') {
    try {
      return agent.run(provider, state, context, workflow)
    } catch (error) {
      return finish(state, assistant(error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return state
}

/**
 * Iterates over the workflow and takes a snapshot of the state after each iteration.
 */
export async function iterate(workflow: Workflow, state: WorkflowState) {
  const nextState = await run(state, [], workflow)
  workflow.snapshot({ prevState: state, nextState })
  return nextState
}
