import { teamwork } from 'fabrice-ai/teamwork'
import { solution } from 'fabrice-ai/workflow'

import { preVisitNoteWorkflow } from './medical_survey/workflow.js'

const result = await teamwork(preVisitNoteWorkflow)

console.log(solution(result))
