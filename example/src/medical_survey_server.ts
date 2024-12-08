/**
 * This example demonstrates using framework in server-side environments.
 */

import { isToolCallRequest } from '@dead-simple-ai-agent/framework/supervisor/runTools'
import { iterate } from '@dead-simple-ai-agent/framework/teamwork'
import { WorkflowState, workflowState } from '@dead-simple-ai-agent/framework/workflow'
import s from 'dedent'
import fastify, { FastifyRequest } from 'fastify'

import { preVisitNoteWorkflow } from './medical_survey/workflow.js'

const server = fastify({ logger: false })

const visits: Record<string, WorkflowState> = {}

/**
 * This will create a new workflow and return the initial state
 */
server.post('/visits', async () => {
  const state = workflowState(preVisitNoteWorkflow)

  // Add the state to the visits map
  visits[state.id] = state

  // Start the visit in the background
  runVisit(state)

  return state
})

/**
 * Call this endpoint to get status of the workflow, or the final result.
 */
server.get('/visits/:id', async (req: FastifyRequest<{ Params: { id: string } }>) => {
  const state = visits[req.params.id]
  if (!state) {
    throw new Error('Workflow not found')
  }

  if (state.status === 'finished') {
    return {
      status: state.status,
      result: state.messages.at(-1)!.content,
    }
  }

  if (state.status === 'assigned') {
    if (state.agentStatus === 'tool') {
      return state.agentRequest.at(-1)!.content
    }
    return {
      status: state.status,
      agentStatus: state.agentStatus,
    }
  }

  return {
    status: state.status,
  }
})

/**
 * Adds a message to the workflow.
 */
server.post(
  '/visits/:id/messages',
  async (req: FastifyRequest<{ Params: { id: string }; Body: ToolCallMessage }>) => {
    const state = visits[req.params.id]
    if (!state) {
      throw new Error('Workflow not found')
    }

    if (state.status !== 'assigned' || state.agentStatus !== 'tool') {
      throw new Error('Workflow is not waiting for a message right now')
    }

    const toolRequestMessage = state.agentRequest.findLast(isToolCallRequest)
    if (!toolRequestMessage) {
      throw new Error('No tool request message found')
    }

    const toolCall = toolRequestMessage.tool_calls.find(
      (toolCall) => toolCall.id === req.body.tool_call_id
    )
    if (!toolCall) {
      throw new Error('Tool call not found')
    }

    visits[req.params.id] = {
      ...state,
      agentRequest: state.agentRequest.concat({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: req.body.content,
      }),
    }

    const allToolRequests = toolRequestMessage.tool_calls.map((toolCall) => toolCall.id)
    const hasAllToolCalls = allToolRequests.every((toolCallId) =>
      state.agentRequest.some(
        (request) => 'tool_call_id' in request && request.tool_call_id === toolCallId
      )
    )

    if (hasAllToolCalls) {
      runVisit(visits[req.params.id])
    }

    return {
      hasAllToolCalls,
    }
  }
)

/**
 * Start the server
 */
const port = parseInt(process.env['PORT'] || '3000')
server.listen({ port })

console.log(s`
  🚀 Server running at http://localhost:${port}

  Run 'curl -X POST http://localhost:${port}/visits' to create a new visit
  Run 'curl -X POST http://localhost:${port}/visits/:id/messages -d '{"tool_call_id":"...","content":"..."}' to add a message to the visit
`)

type ToolCallMessage = {
  tool_call_id: string
  content: string
}

/**
 * Helper function, inspired by `teamwork`.
 * It will continue running the visit in the background and will stop when the workflow is finished.
 */
async function runVisit(state: WorkflowState): Promise<WorkflowState> {
  if (
    state.status === 'finished' ||
    (state.status === 'assigned' && state.agentStatus === 'tool')
  ) {
    return state
  }

  return runVisit(await iterate(preVisitNoteWorkflow, state))
}
