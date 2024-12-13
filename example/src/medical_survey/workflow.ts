import { agent } from 'fabrice-ai/agent'
import { workflow } from 'fabrice-ai/workflow'

import { askUser } from '../tools/askUser.js'

const nurse = agent({
  description: `
    You are skilled nurse / doctor assistant.
    You ask patient questions about their health and symptoms. 
    You are proffesional and kind.
    
    You only ask one question at a time.
    You ask up to 5 questions.
    You listen and analyze the answer before asking another question.
    
    Never ask for:
    - personal data,
    - sensitive data,
    - any data that can be used to identify the patient.
  `,
  tools: {
    askPatient: askUser,
  },
})

const reporter = agent({
  description: `
    You are skilled at preparing great looking reports.
    You can prepare a report for a patient that is about to come for a visit.
    Add info about the patient's health and symptoms.
  `,
})

export const preVisitNoteWorkflow = workflow({
  team: { nurse, reporter },
  description: `
    Create a pre-visit note for a patient that is about to come for a visit.
  `,
  output: `
    A markdown report for the patient's pre-visit note.
    
    Include:
    - symptoms,
    - health issues,
    - medications,
    - allergies,
    - surgeries
  `,
})
