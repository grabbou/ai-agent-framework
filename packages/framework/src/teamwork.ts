import { finalizeWorkflow } from './supervisor/finalizeWorkflow.js'
import { nextTask } from './supervisor/nextTask.js'
import { runAgent } from './supervisor/runAgent.js'
import { runTools } from './supervisor/runTools.js'
import { selectAgent } from './supervisor/selectAgent.js'
import { MessageContent } from './types.js'
import { Workflow, WorkflowState, workflowState } from './workflow.js'

/**
 * Performs single iteration over Workflow and produces its next state.
 */
export async function iterate(workflow: Workflow, state: WorkflowState): Promise<WorkflowState> {
  const { status, messages } = state

  /**
   * When number of messages exceedes number of maximum iterations, we must force finish the workflow
   * and produce best final answer
   */
  if (messages.length > workflow.maxIterations) {
    const content = await finalizeWorkflow(workflow.provider, messages)
    return {
      ...state,
      status: 'finished',
      messages: state.messages.concat({
        role: 'user',
        content,
      }),
    }
  }

  /**
   * When workflow is idle, we must get next task to work on, or finish the workflow otherwise.
   */
  if (status === 'idle') {
    const task = await nextTask(workflow.provider, messages)
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
      }
    } else {
      return {
        ...state,
        status: 'finished',
      }
    }
  }

  /**
   * When workflow is pending, we must find best agent to work on it.
   */
  if (status === 'pending') {
    const selectedAgent = await selectAgent(
      workflow.provider,
      state.agentRequest!,
      workflow.members
    )
    return {
      ...state,
      status: 'assigned',
      agentStatus: 'idle',
      agent: selectedAgent.role,
    }
  }

  /**
   * When workflow is running, we must call assigned agent to continue working on it.
   */
  if (status === 'assigned') {
    const agent = workflow.members.find((member) => member.role === state.agent)
    if (!agent) {
      return {
        ...state,
        status: 'failed',
        messages: state.messages.concat({
          role: 'assistant',
          content: 'No agent found.',
        }),
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
        agentRequest: state.agentRequest?.concat(toolsResponse),
      }
    }

    /**
     * When agent finishes running, it will return status to indicate whether it finished processing.
     *
     * If it finished processing, we will append its final answer to the context. Otherwise, we will
     * further extend agentRequest to carry context over to the next iteration.
     */
    const [agentResponse, status] = await runAgent(agent, state.agentRequest!)
    if (status === 'complete') {
      const agentFinalAnswer = agentResponse.at(-1)!
      return {
        ...state,
        status: 'idle',
        messages: state.messages.concat(agentFinalAnswer),
      }
    }
    return {
      ...state,
      agentStatus: status,
      agentRequest: state.agentRequest?.concat(agentResponse),
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
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 */
export async function teamwork(
  workflow: Workflow,
  state: WorkflowState = workflowState(workflow)
): Promise<MessageContent> {
  const { status, messages } = state

  if (status === 'finished') {
    return messages.at(-1)!.content
  }

  return teamwork(workflow, await iterate(workflow, state))
}
