import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { researchTripWorkflow } from './surprise_trip.config.js'

const result = await teamwork(researchTripWorkflow)

console.log(solution(result))
