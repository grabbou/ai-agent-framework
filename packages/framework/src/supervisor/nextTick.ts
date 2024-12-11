import type { Usage } from '../types.js'
import type { Workflow, WorkflowState } from '../workflow.js'
import { finalizeWorkflow } from './finalizeWorkflow.js'
import { nextTask } from './nextTask.js'
import { runAgent } from './runAgent.js'
import { runTools } from './runTools.js'
import { selectAgent } from './selectAgent.js'

/**
 * Performs single iteration over Workflow and produces its next state.
 */
export async function nextTick(workflow: Workflow, state: WorkflowState): Promise<WorkflowState> {
  const { status, messages } = state

  /**
   * When number of messages exceeds number of maximum iterations, we must force finish the workflow
   * and produce best final answer
   */
  if (messages.length > workflow.maxIterations) {
    const { response, usage } = await finalizeWorkflow(workflow.provider, messages)
    return {
      ...state,
      status: 'finished',
      messages: state.messages.concat({
        role: 'user',
        content: response,
      }),
      usage: combineUsage(state.usage, usage),
    }
  }

  /**
   * When workflow is idle, we must get next task to work on, or finish the workflow otherwise.
   */
  if (status === 'idle') {
    const { task, usage } = await nextTask(workflow.provider, messages)
    if (task) {
      return {
        ...state,
        status: 'pending',
        agentRequest: [
          {
            role: 'user',
            content: task,
          },
        ],
        usage: combineUsage(state.usage, usage),
      }
    } else {
      return {
        ...state,
        status: 'finished',
        usage: combineUsage(state.usage, usage),
      }
    }
  }

  /**
   * When workflow is pending, we must find best agent to work on it.
   */
  if (status === 'pending') {
    const { agent, usage } = await selectAgent(
      workflow.provider,
      state.agentRequest,
      workflow.members
    )
    return {
      ...state,
      status: 'assigned',
      agentStatus: 'idle',
      agent: agent.role,
      usage: combineUsage(state.usage, usage),
    }
  }

  /**
   * When workflow is running, we must call assigned agent to continue working on it.
   */
  if (status === 'assigned') {
    const agent = workflow.members.find((member) => member.role === state.agent)
    if (!agent) {
      return {
        id: state.id,
        status: 'failed',
        messages: state.messages.concat({
          role: 'assistant',
          content: 'No agent found.',
        }),
        usage: state.usage,
      }
    }

    /**
     * When agentStatus is `tool`, an agent is waiting for the tools results.
     * We must run all the tools in order to proceed to the next step.
     */
    if (state.agentStatus === 'tool') {
      const toolsResponse = await runTools(agent, state.agentRequest!)
      return {
        ...state,
        agentStatus: 'step',
        agentRequest: state.agentRequest.concat(toolsResponse),
      }
    }

    /**
     * When agent finishes running, it will return status to indicate whether it finished processing.
     *
     * If it finished processing, we will append its final answer to the context, as well as
     * first message from `agentRequest`, which holds the actual task, excluding middle-steps.
     *
     * If further processing is required, we will carry `agentRequest` over to the next iteration.
     */
    const { kind, message, usage } = await runAgent(agent, state.messages, state.agentRequest)
    if (kind === 'complete') {
      return {
        ...state,
        status: 'idle',
        messages: state.messages.concat(state.agentRequest[0], message),
        usage: combineUsage(state.usage, usage),
      }
    }
    return {
      ...state,
      agentStatus: kind,
      agentRequest: state.agentRequest.concat(message),
      usage: combineUsage(state.usage, usage),
    }
  }

  /**
   * When workflow fails due to unexpected error, we must attempt recovering or finish the workflow
   * otherwise.
   */
  if (status === 'failed') {
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
  const nextState = await nextTick(workflow, state)
  workflow.snapshot({ prevState: state, nextState })
  return nextState
}

function combineUsage(prevUsage: Usage, usage: Usage | undefined) {
  return {
    prompt_tokens: prevUsage.prompt_tokens + (usage?.prompt_tokens ?? 0),
    completion_tokens: prevUsage.completion_tokens + (usage?.completion_tokens ?? 0),
    total_tokens: prevUsage.total_tokens + (usage?.total_tokens ?? 0),
  }
}
