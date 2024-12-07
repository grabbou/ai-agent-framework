import { teamwork } from '@dead-simple-ai-agent/framework/teamwork'

import { preVisitNoteWorkflow } from './medical_survey_stateless.js'

const result = await teamwork(preVisitNoteWorkflow)

console.log(result)
