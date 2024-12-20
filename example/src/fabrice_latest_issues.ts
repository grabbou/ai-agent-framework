import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { checkupGithubProject } from './fabrice_latest_issues.config'

const result = await teamwork(checkupGithubProject)

console.log(solution(result))
