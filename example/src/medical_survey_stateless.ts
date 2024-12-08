/**
 * Example borrowed from CrewAI.
 */

import { iterate } from '@dead-simple-ai-agent/framework/teamwork'
import { workflowState } from '@dead-simple-ai-agent/framework/workflow'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { preVisitNoteWorkflow } from './medical_survey/workflow.js'

const tmpDir = tmpdir()
const dbPath = join(tmpDir, 'stepping_survey_workflow_db.json')

let state = workflowState(preVisitNoteWorkflow)
if (await fs.exists(dbPath)) {
  try {
    state = JSON.parse(await fs.readFile(dbPath, 'utf-8'))
    console.log('🛟 Loaded workflow from', dbPath)
    if (state.status === 'finished') {
      console.log('🛟 Workflow already finished. Starting new workflow.')
      state = workflowState(preVisitNoteWorkflow)
    }
  } catch (error) {
    console.log(`🚨Error while loading workflow from ${dbPath}. Starting new workflow.`)
  }
}

const nextState = await iterate(preVisitNoteWorkflow, state)
console.log(`🚀 Step completed. run again to execute the next step`)

await fs.writeFile(dbPath, JSON.stringify(nextState, null, 2), 'utf-8')
