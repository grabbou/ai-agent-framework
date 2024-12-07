/**
 * Example borrowed from CrewAI.
 */

import { iterate } from '@dead-simple-ai-agent/framework/teamwork'
import { workflowState } from '@dead-simple-ai-agent/framework/workflow'
import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const server = fastify({ logger: false })

import { preVisitNoteWorkflow } from './medical_survey/workflow_server.js'

const dbPath = (id: string) => join(tmpdir(), id + '_workflow_db.json')

let state = workflowState(preVisitNoteWorkflow)

server.get('/start', async () => {
  const nextState = await iterate(preVisitNoteWorkflow, state)

  await fs.writeFile(dbPath(nextState.id), JSON.stringify(nextState, null, 2), 'utf-8')

  return {
    status: 'running',
    state: nextState,
  }
})

server.post(
  '/iterate/:id',
  async (req: FastifyRequest<{ Params: { id: string }; Body: { message: string } }>) => {
    const { id } = req.params
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
console.log(` Server running at http://localhost:${port}`)
