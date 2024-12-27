import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { checkupGithubProject } from './github_latest_issues_email.config.js'

const result = await teamwork(checkupGithubProject)

console.log(solution(result))
