import { teamwork } from 'fabrice/teamwork'
import { solution } from 'fabrice/workflow'

import { preVisitNoteWorkflow } from './medical_survey/workflow.js'

const result = await teamwork(preVisitNoteWorkflow)

console.log(solution(result))
