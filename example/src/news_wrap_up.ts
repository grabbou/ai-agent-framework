import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { wrapUpTheNewsWorkflow } from './news_wrap_up.config.js'

const result = await teamwork(wrapUpTheNewsWorkflow)

console.log(solution(result))
