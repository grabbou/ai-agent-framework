import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { wikipediaResearch } from './wikipedia_vector.workflow.js'

const result = await teamwork(wikipediaResearch)

console.log(solution(result))
