import { agent } from 'fabrice-ai/agent'
import { workflow } from 'fabrice-ai/workflow'

import { askUser } from '../tools/askUser.js'

const nurse = agent({
  role: 'Nurse',
  description: `
    You are skilled nurse / doctor assistant.
    You role is to cooperate with reporter to create a pre-visit note for a patient that is about to come for a visit.
    Ask user questions about the patient's health and symptoms. 
    Ask one question at time up to 5 questions. 
  `,
  tools: {
    askPatient: askUser,
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
  `,
  knowledge: `
    Ask one question at time up to 5 questions. 
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
