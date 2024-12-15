import { grok } from 'fabrice-ai/providers/grok'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { preVisitNoteWorkflow } from './medical_survey/workflow.js'

const result = await teamwork({
  ...preVisitNoteWorkflow,
  provider: grok(),
})

console.log(solution(result))
