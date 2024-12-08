/**
 * This example demonstrates using framework in server-side environments.
 */

import { iterate } from '@dead-simple-ai-agent/framework/teamwork'
import { WorkflowState, workflowState } from '@dead-simple-ai-agent/framework/workflow'
import fastify, { FastifyRequest } from 'fastify'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { preVisitNoteWorkflow } from './medical_survey/workflow.js'

const server = fastify({ logger: false })

const dbPath = (id: string) => join(tmpdir(), `${id}_workflow.json`)

const visits: Record<string, WorkflowState> = {}

/**
 * This will create a new workflow and return the initial state
 */
server.post('/visits', async () => {
  const state = workflowState(preVisitNoteWorkflow)
  visits[state.id] = state
  return state
})

/**
 * Call this endpoint to iterate on the workflow
 */

// tbd:

type ToolCallMessage = {
  tool_call_id: string
  content: string
}

/**
 * Once you get response for tools, you can execute this endpoint to continue the workflow.
 */
server.post(
  '/visits/:id/messages',
  async (req: FastifyRequest<{ Params: { id: string }; Body: ToolCallMessage }>) => {
    const state = visits[req.params.id]
    if (!state) {
      throw new Error('Workflow not found')
    }

    if (!state.status !== 'assigned') {
      throw new Error('Workflow is not waiting for a message right now')
    }

    const { message } = req.body

    const path = dbPath(id)

    if (await fs.exists(path)) {
      try {
        state = JSON.parse(await fs.readFile(path, 'utf-8'))
        console.log('🛟 Loaded workflow from', path)
      } catch (error) {
        console.log(`🚨Error while loading workflow from ${path}. Starting new workflow.`)
      }
    }

    if (message) {
      // message provided within the call - for example a return call from API/Slack/Whatever
      state.messages.push({ role: 'user', content: message })
    }

    const nextState = await iterate(preVisitNoteWorkflow, state)
    await fs.writeFile(path, JSON.stringify(nextState, null, 2), 'utf-8')

    return nextState
  }
)

const port = parseInt(process.env['PORT'] || '3000', 10)
server.listen({
  port,
})

console.log(`🚀 Server running at http://localhost:${port}`)
console.log(`Run 'curl -X POST http://localhost:${port}/start' to start the workflow`)
console.log(
  `Run 'curl -X POST http://localhost:${port}/iterate/ID -d '{"message":"Hello"}' to iterate the workflow with the message provided optionally as an answer added to the state`
)
