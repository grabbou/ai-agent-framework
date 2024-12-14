import { ollama } from 'fabrice-ai/providers/ollama'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { preVisitNoteWorkflow } from './medical_survey/workflow.js'

const result = await teamwork({
  ...preVisitNoteWorkflow,
  provider: ollama({
    model: 'phi3',
  }),
})

console.log(solution(result))
