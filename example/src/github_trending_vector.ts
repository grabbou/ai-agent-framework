import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { wrapUpTrending } from './github_trending_vector.workflow.js'

const result = await teamwork(wrapUpTrending)

console.log(solution(result))
