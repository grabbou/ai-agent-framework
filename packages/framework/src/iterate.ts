import { childState, WorkflowState } from './state.js'
import { runTools } from './tool_calls.js'
import { Message } from './types.js'
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

  if (state.child) {
    const child = await run(state.child, context.concat(state.messages), workflow)
    if (child.status === 'finished') {
      return {
        ...state,
        messages: state.messages.concat(child.messages),
        child: null,
      }
    }
    return {
      ...state,
      child,
    }
  }

  const agent = workflow.team[state.agent]

  if (state.status === 'paused') {
    const toolsResponse = await runTools(agent, state.messages)
    return {
      ...state,
      status: 'running',
      messages: state.messages.concat(toolsResponse),
    }
  }

  if (state.status === 'running' || state.status === 'idle') {
    return agent.run(state, context, workflow.team)
  }

  if (state.status === 'failed') {
    return {
      ...state,
      status: 'finished',
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
