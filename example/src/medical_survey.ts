import { teamwork } from '@dead-simple-ai-agent/framework/teamwork'
import { solution } from '@dead-simple-ai-agent/framework/workflow'

import { preVisitNoteWorkflow } from './medical_survey/workflow.js'

const result = await teamwork(preVisitNoteWorkflow)

console.log(solution(result))
