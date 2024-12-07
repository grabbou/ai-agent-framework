/**
 * Example borrowed from CrewAI.
 */
import { agent } from '@dead-simple-ai-agent/framework/agent'
import { iterate } from '@dead-simple-ai-agent/framework/teamwork'
import { tool } from '@dead-simple-ai-agent/framework/tool'
import { workflow, workflowState } from '@dead-simple-ai-agent/framework/workflow'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { z } from 'zod'

async function requestUserInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    console.log(prompt)
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim())
    })
  })
}
export const askPatient = tool({
  description: 'Tool for asking patient a question',
  parameters: z.object({
    query: z.string().describe('The question to ask the patient'),
  }),
  execute: ({ query }): Promise<string> => {
    return requestUserInput(query)
  },
})

const nurse = agent({
  role: 'Nurse,doctor assistant',
  description: `
    You are skille nurse / doctor assistant.
    You role is to cooperate with reporter to create a pre-visit note for a patient that is about to come for a visit.
    Ask user questions about the patient's health and symptoms. 
    Ask one question at time up to 5 questions. 
  `,
  tools: {
    ask_question: askPatient,
  },
})

const reporter = agent({
  role: 'Reporter',
  description: `
    You are skilled at preparing great looking markdown reports.
    Prepare a report for a patient that is about to come for a visit.
    Add info about the patient's health and symptoms.
    If something is not clear use Wikipedia to check.
  `,
  tools: {},
})

const preVisitNoteWorkflow = workflow({
  members: [nurse, reporter],
  description: `
    Create a pre-visit note for a patient that is about to come for a visit.
    The note should include the patient's health and symptoms.
    
    Include:
    - symptoms,
    - health issues,
    - medications,
    - allergies,
    - surgeries

    Never ask fo:
    - personal data,
    - sensitive data,
    - any data that can be used to identify the patient.
  `,
  output: `
    A markdown report for the patient's pre-visit note.
  `,
})

const tmpDir = tmpdir()
const dbPath = join(tmpDir, 'stepping_survey_workflow_db.json')

let state = workflowState(preVisitNoteWorkflow)
if (await fs.exists(dbPath)) {
  try {
    state = JSON.parse(await fs.readFile(dbPath, 'utf-8'))
    console.log('🛟 Loaded workflow from', dbPath)
  } catch (error) {
    console.log(`🚨Error while loading workflow from ${dbPath}. Starting new workflow.`)
  }
}

const nextState = await iterate(preVisitNoteWorkflow, state)

await fs.writeFile(dbPath, JSON.stringify(nextState, null, 2), 'utf-8')
