/**
 * This example demonstrates using framework in server-side environments.
 */
import { teamwork } from '@dead-simple-ai-agent/framework/server'
import { isToolCallRequest } from '@dead-simple-ai-agent/framework/supervisor/runTools'
import { WorkflowState, workflowState } from '@dead-simple-ai-agent/framework/workflow'
import chalk from 'chalk'
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
  runVisit(state.id)

  return {
    id: state.id,
    status: state.status,
  }
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
      return state.agentRequest.findLast(isToolCallRequest)!.tool_calls
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

    const agentRequest = state.agentRequest.concat({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: req.body.content,
    })

    const allToolRequests = toolRequestMessage.tool_calls.map((toolCall) => toolCall.id)
    const hasAllToolCalls = allToolRequests.every((toolCallId) =>
      agentRequest.some(
        (request) => 'tool_call_id' in request && request.tool_call_id === toolCallId
      )
    )

    // Add tool response to the workflow
    // Change agent status to `step` if all tool calls have been added, so
    // runVisit will continue
    if (hasAllToolCalls) {
      visits[req.params.id] = {
        ...state,
        agentStatus: 'step',
        agentRequest,
      }
      runVisit(req.params.id)
    } else {
      visits[req.params.id] = {
        ...state,
        agentRequest,
      }
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

  Things to do:

  ${chalk.bold('🩺 Create a new visit:')}
  ${chalk.gray(`curl -X POST http://localhost:${port}/visits`)}

  ${chalk.bold('💻 Check the status of the visit:')}
  ${chalk.gray(`curl -X GET http://localhost:${port}/visits/:id`)}

  ${chalk.bold('🔧 If the workflow is waiting for a tool call, you will get a response like this:')}
  ${chalk.gray(`[{"id":"<tool_call_id>","type":"function"}]`)}

  ${chalk.bold('📝 Add a message to the visit:')}
  ${chalk.gray(`curl -X POST http://localhost:${port}/visits/:id/messages H "Content-Type: application/json" -d '{"tool_call_id":"...","content":"..."}'`)}

  Note:
  - You can only add messages when the workflow is waiting for a tool call
`)

type ToolCallMessage = {
  tool_call_id: string
  content: string
}

async function runVisit(id: string) {
  visits[id] = await teamwork(preVisitNoteWorkflow, visits[id])
}
