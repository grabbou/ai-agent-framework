/**
 * Example borrowed from CrewAI.
 */
import { agent } from '@dead-simple-ai-agent/framework/agent'
import { memory } from '@dead-simple-ai-agent/framework/memory'
import { teamworkStep } from '@dead-simple-ai-agent/framework/step'
import { tool } from '@dead-simple-ai-agent/framework/tool'
import { workflow } from '@dead-simple-ai-agent/framework/workflow'
import { load, save } from '@dead-simple-ai-agent/memory-lowdb'
import { promises as fs } from 'fs'
import { nanoid } from 'nanoid'
import { join } from 'path'
import { z } from 'zod'

import { lookupWikipedia } from './tools.js'

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
  tools: {
    lookupWikipedia,
  },
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

let id: string
const idFilePath = join(__dirname, 'last-run-id.txt')

if (process.argv.length > 2) {
  id = process.argv[2]
} else {
  try {
    id = await fs.readFile(idFilePath, 'utf-8')
  } catch (error) {
    id = nanoid()
  }
}
await fs.writeFile(idFilePath, id, 'utf-8')

console.log('🛟 Run ID:', id)
console.log('🛟 Executing single next step')

const result = await teamworkStep(
  id,
  preVisitNoteWorkflow,
  memory({
    load,
    save,
  })
) // exec the next step

console.log(result)
