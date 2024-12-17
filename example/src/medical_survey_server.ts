import 'dotenv/config'

/**
 * This example demonstrates using framework in server-side environments.
 */
import { randomUUID } from 'node:crypto'

import chalk from 'chalk'
import s from 'dedent'
import { rootState, WorkflowState } from 'fabrice-ai/state'
import { hasPausedStatus, teamwork } from 'fabrice-ai/teamwork'
import {
  addToolResponse,
  getAllMissingToolCalls,
  resumeCompletedToolCalls,
} from 'fabrice-ai/tool_calls'
import fastify, { FastifyRequest } from 'fastify'

import { preVisitNoteWorkflow } from './medical_survey.workflow.js'

const server = fastify({ logger: false })

const visits: Record<string, WorkflowState> = {}

/**
 * This will create a new workflow and return the initial state
 */
server.post('/visits', async () => {
  const id = randomUUID()
  const state = rootState(preVisitNoteWorkflow)

  // Add the state to the visits map
  visits[id] = state

  // Start the visit in the background
  runVisit(id)

  return {
    id,
    status: state.status,
  }
})

/**
 * Call this endpoint to get pending tool calls
 */
server.get('/visits/:id', async (req: FastifyRequest<{ Params: { id: string } }>) => {
  const state = visits[req.params.id]
  if (!state) {
    throw new Error('Workflow not found')
  }
  return getAllMissingToolCalls(state)
})

/**
 * Adds a message to the workflow.
 */
server.post(
  '/visits/:id/messages',
  async (req: FastifyRequest<{ Params: { id: string }; Body: ToolCallMessage }>) => {
    const state = visits[req.params.id]
    if (!state) {
      throw new Error('Workflow not found.')
    }

    if (!hasPausedStatus(state)) {
      throw new Error('Workflow is not waiting for a message right now.')
    }

    // Add the tool response to the workflow
    // and update the statuses
    const newState = resumeCompletedToolCalls(
      addToolResponse(state, req.body.tool_call_id, req.body.content)
    )

    const hasAllToolCalls = getAllMissingToolCalls(newState).length === 0

    // Run the workflow again
    if (hasAllToolCalls) {
      visits[req.params.id] = await teamwork(preVisitNoteWorkflow, newState)
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
  ${chalk.gray(`curl -X POST http://localhost:${port}/visits/:id/messages -H "Content-Type: application/json" -d '{"tool_call_id":"...","content":"..."}'`)}

  Note:
  - You can only add messages when the workflow is waiting for a tool call
`)

type ToolCallMessage = {
  tool_call_id: string
  content: string
}

async function runVisit(id: string) {
  visits[id] = await teamwork(preVisitNoteWorkflow, visits[id], false)
}
