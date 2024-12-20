import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { preVisitNoteWorkflow } from './medical_survey.config.js'

const result = await teamwork(preVisitNoteWorkflow)

console.log(solution(result))
