import { agent } from '@dead-simple-ai-agent/framework/agent'
import { workflow } from '@dead-simple-ai-agent/framework/workflow'

const nurse = agent({
  role: 'Nurse,doctor assistant',
  description: `
      You are skille nurse / doctor assistant.
      You role is to cooperate with reporter to create a pre-visit note for a patient that is about to come for a visit.
      Ask user questions about the patient's health and symptoms. 
      Ask one question at time up to 5 questions. 
      Asynchronously Wait for the response - which will be next message addedto the workflow.
    `,
})

const reporter = agent({
  role: 'Reporter',
  description: `
      You are skilled at preparing great looking markdown reports.
      Prepare a report for a patient that is about to come for a visit.
      Add info about the patient's health and symptoms.
    `,
  tools: {},
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
