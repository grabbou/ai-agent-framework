import { agent } from 'fabrice/agent'
import { tool } from 'fabrice/tool'
import { workflow } from 'fabrice/workflow'
import { z } from 'zod'

async function requestUserInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    console.log(prompt)
    process.stdin.resume()
    process.stdin.once('data', (data) => {
      process.stdin.pause()
      resolve(data.toString().trim())
    })
  })
}

const askPatient = tool({
  description: 'Tool for asking patient a question',
  parameters: z.object({
    query: z.string().describe('The question to ask the patient'),
  }),
  execute: ({ query }): Promise<string> => {
    return requestUserInput(query)
  },
})

const nurse = agent({
  role: 'Nurse',
  description: `
    You are skille nurse / doctor assistant.
    You role is to cooperate with reporter to create a pre-visit note for a patient that is about to come for a visit.
    Ask user questions about the patient's health and symptoms. 
    Ask one question at time up to 5 questions. 
  `,
  tools: {
    askPatient,
  },
})

const reporter = agent({
  role: 'Reporter',
  description: `
    You are skilled at preparing great looking reports.
    You can prepare a report for a patient that is about to come for a visit.
    Add info about the patient's health and symptoms.
  `,
})

export const preVisitNoteWorkflow = workflow({
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
